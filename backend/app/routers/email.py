from fastapi import APIRouter

from app.models.schemas import MeetingSummary, FollowUpEmail
from app.services.email_service import generate_followup_email

router = APIRouter(prefix="/api/email")


@router.post("/generate", response_model=FollowUpEmail)
def generate_email(summary: MeetingSummary):
    return generate_followup_email(summary)