from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import bcrypt

if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})

SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-123")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password[:71])

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)