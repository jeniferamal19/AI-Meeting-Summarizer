from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Meeting(Base):
    __tablename__ = "meetings"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    user_id = Column(String, index=True)
    transcript = Column(Text, nullable=False)
    summary_json = Column(Text, nullable=False)
    speaker_transcript_json = Column(Text, default="[]")
    created_at = Column(DateTime(timezone=True), server_default=func.now())