from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
import database as db
import auth
from pydantic import BaseModel

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    database = db.SessionLocal()
    try:
        yield database
    finally:
        database.close()

class UserCreate(BaseModel):
    username: str
    password: str

class TabCreate(BaseModel):
    name: str

class LinkCreate(BaseModel):
    tab_id: int
    title: str
    url: str

async def get_current_user(token: str = Depends(oauth2_scheme), s: Session = Depends(get_db)):
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None: raise HTTPException(status_code=401)
    except auth.JWTError: raise HTTPException(status_code=401)
    user = s.query(db.User).filter(db.User.username == username).first()
    if user is None: raise HTTPException(status_code=401)
    return user

@app.post("/api/register")
def register(user: UserCreate, s: Session = Depends(get_db)):
    db_user = s.query(db.User).filter(db.User.username == user.username).first()
    if db_user: raise HTTPException(status_code=400, detail="Username already registered")
    new_user = db.User(username=user.username, hashed_password=auth.get_password_hash(user.password))
    s.add(new_user)
    s.commit()
    return {"message": "User created"}

@app.post("/api/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), s: Session = Depends(get_db)):
    user = s.query(db.User).filter(db.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/data")
def get_data(user: db.User = Depends(get_current_user), s: Session = Depends(get_db)):
    tabs = s.query(db.Tab).filter(db.Tab.user_id == user.id).all()
    links = s.query(db.Link).join(db.Tab).filter(db.Tab.user_id == user.id).all()
    return {"tabs": tabs, "links": links}

@app.post("/api/tabs")
def create_tab(tab: TabCreate, user: db.User = Depends(get_current_user), s: Session = Depends(get_db)):
    new_tab = db.Tab(name=tab.name, user_id=user.id)
    s.add(new_tab)
    s.commit()
    s.refresh(new_tab)
    return new_tab

@app.delete("/api/tabs/{tab_id}")
def delete_tab(tab_id: int, user: db.User = Depends(get_current_user), s: Session = Depends(get_db)):
    tab = s.query(db.Tab).filter(db.Tab.id == tab_id, db.Tab.user_id == user.id).first()
    if not tab: raise HTTPException(status_code=404)
    s.delete(tab)
    s.commit()
    return {"status": "deleted"}

@app.post("/api/links")
def create_link(link: LinkCreate, user: db.User = Depends(get_current_user), s: Session = Depends(get_db)):
    tab = s.query(db.Tab).filter(db.Tab.id == link.tab_id, db.Tab.user_id == user.id).first()
    if not tab: raise HTTPException(status_code=404)
    new_link = db.Link(tab_id=link.tab_id, title=link.title, url=link.url)
    s.add(new_link)
    s.commit()
    s.refresh(new_link)
    return new_link

@app.delete("/api/links/{link_id}")
def delete_link(link_id: int, user: db.User = Depends(get_current_user), s: Session = Depends(get_db)):
    link = s.query(db.Link).join(db.Tab).filter(db.Link.id == link_id, db.Tab.user_id == user.id).first()
    if not link: raise HTTPException(status_code=404)
    s.delete(link)
    s.commit()
    return {"status": "deleted"}