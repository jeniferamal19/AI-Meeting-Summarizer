import json
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.crud import get_all_meetings, get_meeting_by_id, delete_meeting
from app.auth import get_current_user

router = APIRouter(prefix="/api/history")


class TitleUpdate(BaseModel):
    title: str


def _row_to_response(meeting) -> dict:
    return {
        "id": meeting.id,
        "title": meeting.title,
        "created_at": meeting.created_at.isoformat(),
        "transcript": meeting.transcript,
        "summary": json.loads(meeting.summary_json),
        "speaker_transcript": json.loads(meeting.speaker_transcript_json),
    }


@router.get("/")
def list_meetings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    meetings = get_all_meetings(db, user["id"])
    return [{"id": m.id, "title": m.title, "created_at": m.created_at.isoformat()} for m in meetings]


@router.get("/{meeting_id}")
def get_meeting(meeting_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    meeting = get_meeting_by_id(db, meeting_id, user["id"])
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return _row_to_response(meeting)


@router.delete("/{meeting_id}")
def remove_meeting(meeting_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not delete_meeting(db, meeting_id, user["id"]):
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"deleted": True}


@router.patch("/{meeting_id}/title")
def update_title(meeting_id: int, body: TitleUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    meeting = get_meeting_by_id(db, meeting_id, user["id"])
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    meeting.title = body.title
    db.commit()
    return {"id": meeting.id, "title": meeting.title}