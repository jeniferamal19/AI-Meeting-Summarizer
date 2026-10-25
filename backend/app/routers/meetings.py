from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.utils.file_handler import save_file
from app.services.transcription import transcribe_audio
from app.services.summarization import summarize_text
from app.services.diarization import diarize_audio
from app.services.merge_service import merge_transcript_with_speakers
from app.services.video_processor import is_video_file, extract_audio
from app.models.schemas import ProcessResponse
from app.db.database import get_db
from app.db.crud import save_meeting
from app.auth import get_current_user

router = APIRouter(prefix="/api")


class TranscriptIn(BaseModel):
    transcript: str


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/process", response_model=ProcessResponse)
async def process_meeting(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    filepath = save_file(file)

    audio_filepath = filepath
    if is_video_file(filepath):
        audio_filepath = extract_audio(filepath)

    transcription = transcribe_audio(audio_filepath)
    transcript_text = transcription["text"]
    transcript_segments = transcription["segments"]

    summary = summarize_text(transcript_text)

    try:
        diarization_segments = diarize_audio(filepath)
    except Exception as e:
        print(f"Diarization failed: {e}")
        diarization_segments = []

    speaker_transcript = merge_transcript_with_speakers(transcript_segments, diarization_segments)

    response = ProcessResponse(
        transcript=transcript_text,
        summary=summary,
        speaker_transcript=speaker_transcript,
    )

    save_meeting(db, response, user["id"])
    return response


@router.post("/live/chunk")
async def live_chunk(file: UploadFile = File(...)):
    """Receives a short audio chunk from the Chrome extension
    and returns its transcription."""
    filepath = save_file(file)
    transcription = transcribe_audio(filepath)
    return {"text": transcription["text"]}


@router.post("/summarize-text", response_model=ProcessResponse)
async def summarize_live_transcript(
    body: TranscriptIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    """Summarizes a transcript captured by the Chrome extension (no audio file)."""
    transcript_text = body.transcript.strip()

    summary = summarize_text(transcript_text)

    response = ProcessResponse(
        transcript=transcript_text,
        summary=summary,
        speaker_transcript=[],
    )

    save_meeting(db, response, user["id"])
    return response