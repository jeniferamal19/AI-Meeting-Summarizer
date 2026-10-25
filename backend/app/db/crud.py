import json
from sqlalchemy.orm import Session
from app.db.models import Meeting
from app.models.schemas import ProcessResponse


def save_meeting(db: Session, result: ProcessResponse, user_id: str | None = None) -> Meeting:
    topics = result.summary.topics_discussed
    title = topics[0] if topics else "Untitled Meeting"
    meeting = Meeting(
        user_id=user_id,
        title=title,
        transcript=result.transcript,
        summary_json=result.summary.model_dump_json(),
        speaker_transcript_json=json.dumps([turn.model_dump() for turn in result.speaker_transcript]),
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


def get_all_meetings(db: Session, user_id: str | None = None):
    query = db.query(Meeting)
    if user_id:
        query = query.filter(Meeting.user_id == user_id)
    return query.order_by(Meeting.created_at.desc()).all()


def get_meeting_by_id(db: Session, meeting_id: int, user_id: str | None = None):
    query = db.query(Meeting).filter(Meeting.id == meeting_id)
    if user_id:
        query = query.filter(Meeting.user_id == user_id)
    return query.first()


def delete_meeting(db: Session, meeting_id: int, user_id: str | None = None) -> bool:
    meeting = get_meeting_by_id(db, meeting_id, user_id)
    if not meeting:
        return False
    db.delete(meeting)
    db.commit()
    return True