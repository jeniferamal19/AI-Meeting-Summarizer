from pydantic import BaseModel
from typing import List, Optional


class ActionItem(BaseModel):
    task: str
    owner: Optional[str] = None
    due: Optional[str] = None


class MeetingSummary(BaseModel):
    summary: str
    key_decisions: List[str] = []
    risks_blockers: List[str] = []
    action_items: List[ActionItem] = []
    topics_discussed: List[str] = []


class SpeakerTurn(BaseModel):
    speaker: str
    text: str
    start: float
    end: float


class ProcessResponse(BaseModel):
    transcript: str
    summary: MeetingSummary
    speaker_transcript: List[SpeakerTurn] = []


class FollowUpEmail(BaseModel):
    subject: str
    body: str