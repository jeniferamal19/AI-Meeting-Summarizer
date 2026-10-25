import os
import ffmpeg

UPLOAD_DIR = "uploads"

def save_file(file):
    filepath = os.path.join(UPLOAD_DIR, file.filename)

    with open(filepath, "wb") as buffer:
        buffer.write(file.file.read())

    return filepath


def extract_audio(filepath: str) -> str:
    """
    Converts the uploaded file (audio OR video, any container FFmpeg
    supports) into a standardized 16kHz mono WAV file. Both Whisper
    (Groq) and pyannote's soundfile-based loader can read this reliably —
    unlike raw MP4/WEBM, which soundfile can't decode at all.
    """
    base, _ = os.path.splitext(filepath)
    audio_path = f"{base}_audio.wav"

    try:
        (
            ffmpeg
            .input(filepath)
            .output(audio_path, format="wav", acodec="pcm_s16le", ac=1, ar="16000")
            .overwrite_output()
            .run(quiet=True, capture_stdout=True, capture_stderr=True)
        )
    except ffmpeg.Error as e:
        stderr = e.stderr.decode(errors="ignore") if e.stderr else str(e)
        raise RuntimeError(f"FFmpeg failed to extract audio from {filepath}: {stderr}")

    return audio_path