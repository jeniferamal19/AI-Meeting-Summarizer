from groq import Groq
from app.core.config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)

def transcribe_audio(filepath: str):
    """
    Returns a dict: {"text": full transcript, "segments": [{"start": float, "end": float, "text": str}, ...]}
    """
    with open(filepath, "rb") as f:
        response = client.audio.transcriptions.create(
            file=f,
            model="whisper-large-v3",
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = [
        {"start": seg["start"], "end": seg["end"], "text": seg["text"].strip()}
        for seg in response.segments
    ]

    return {"text": response.text, "segments": segments}