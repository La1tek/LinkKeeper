from sqlalchemy import create_engine, Column, Integer, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

SQLALCHEMY_DATABASE_URL = "sqlite:////data/linkkeeper.db"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    tabs = relationship("Tab", back_populates="owner", cascade="all, delete-orphan")

class Tab(Base):
    __tablename__ = "tabs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="tabs")
    links = relationship("Link", back_populates="tab", cascade="all, delete-orphan")

class Link(Base):
    __tablename__ = "links"
    id = Column(Integer, primary_key=True, index=True)
    tab_id = Column(Integer, ForeignKey("tabs.id"))
    title = Column(String)
    url = Column(String)
    tab = relationship("Tab", back_populates="links")

Base.metadata.create_all(bind=engine)