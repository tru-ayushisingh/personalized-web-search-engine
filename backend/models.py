# backend/models.py
import os
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = "user_profiles"
    id             = Column(Integer, primary_key=True)
    session_id     = Column(String(100), unique=True, nullable=False)
    # Stored as JSON string: {"pizza": 0.8, "restaurant": 0.6}
    profile_vector = Column(Text, default="{}")
    updated_at     = Column(DateTime, default=datetime.utcnow)

class ClickLog(Base):
    __tablename__ = "click_logs"
    id             = Column(Integer, primary_key=True)
    session_id     = Column(String(100), nullable=False)
    query          = Column(String(500))
    result_url     = Column(String(1000))
    result_title   = Column(String(500))
    result_snippet = Column(Text)
    clicked_at     = Column(DateTime, default=datetime.utcnow)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
engine   = create_engine(f"sqlite:///{BASE_DIR}/search.db", echo=False)
Base.metadata.create_all(engine)
Session  = sessionmaker(bind=engine)