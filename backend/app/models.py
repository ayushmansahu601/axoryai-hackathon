# backend/app/models.py

from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from app.database import db

class Detection(db):
    __tablename__ = 'detections'
    content_hash = Column(String, primary_key=True) # file md5 hash to avoid duplication
    content_link = Column(String, nullable=True) # file path or s3 bucket url
    content_source = Column(String, nullable=True) # source of the content if it exists
    content_type = Column(String, nullable=False) # file extension
    user_id = Column(String, nullable=False, default="superuser") # user who uploaded the file
    deepfake = Column(Boolean, nullable=True) # deepfake True/False can be NaN
    result = Column(String, nullable=True) # result as string, can be NaN
    confidence_score = Column(Integer, nullable=True) #confidence score
    timestamp = Column(DateTime, nullable=False) # timestamp of video upload
    original_name = Column(String, nullable=True) # original file name