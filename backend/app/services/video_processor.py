import os
import subprocess

AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".ogg"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mkv", ".mov", ".avi"}

FFMPEG_PATH = r"C:\ffmpeg\bin\ffmpeg.exe"


def is_video_file(filepath: str) -> bool:
    ext = os.path.splitext(filepath)[1].lower()
    return ext in VIDEO_EXTENSIONS


def extract_audio(video_filepath: str) -> str:
    """
    Extracts the audio track from a video file and saves it as a .wav file.
    Returns the path to the extracted audio file.
    """
    base = os.path.splitext(video_filepath)[0]
    audio_filepath = base + "_extracted.wav"

    command = [
        FFMPEG_PATH,
        "-i", video_filepath,
        "-ac", "1",
        "-ar", "16000",
        "-acodec", "pcm_s16le",
        "-y",
        audio_filepath
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print("FFmpeg stdout:", result.stdout)
        print("FFmpeg stderr:", result.stderr)
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")

    return audio_filepath