from fastapi import APIRouter, UploadFile, File

from app.utils.file_handler import save_file
from app.services.transcription import transcribe_audio
from app.services.summarization import summarize_text
from app.services.diarization import diarize_audio
from app.services.merge_service import merge_transcript_with_speakers
from app.models.schemas import ProcessResponse

router = APIRouter(prefix="/api")


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/process", response_model=ProcessResponse)
async def process_meeting(file: UploadFile = File(...)):
    filepath = save_file(file)

    transcription = transcribe_audio(filepath)
    transcript_text = transcription["text"]
    transcript_segments = transcription["segments"]

    summary = summarize_text(transcript_text)

    try:
        diarization_segments = diarize_audio(filepath)
    except Exception as e:
        # Diarization is a nice-to-have — if it fails, don't break the whole request
        print(f"Diarization failed: {e}")
        diarization_segments = []

    speaker_transcript = merge_transcript_with_speakers(transcript_segments, diarization_segments)

    return ProcessResponse(
        transcript=transcript_text,
        summary=summary,
        speaker_transcript=speaker_transcript,
    )