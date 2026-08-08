import os
import torch
import soundfile as sf
from dotenv import load_dotenv
from pyannote.audio import Pipeline

load_dotenv()

_pipeline = None


def _get_pipeline():
    """Load the diarization model once and reuse it — loading it fresh
    on every request would be extremely slow."""
    global _pipeline
    if _pipeline is None:
        token = os.getenv("HUGGINGFACE_TOKEN")
        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            token=token,
        )
    return _pipeline


def diarize_audio(filepath: str):
    """
    Returns a list of speaker turns, e.g.:
    [
        {"speaker": "SPEAKER_00", "start": 0.0, "end": 4.2},
        {"speaker": "SPEAKER_01", "start": 4.5, "end": 9.8},
        ...
    ]
    """
    pipeline = _get_pipeline()

    # Load audio ourselves with soundfile instead of letting pyannote
    # read the file path directly — sidesteps the broken torchcodec
    # dependency entirely.
    waveform_np, sample_rate = sf.read(filepath, dtype="float32", always_2d=True)
    waveform = torch.from_numpy(waveform_np.T)  # shape: (channels, time)

    result = pipeline({"waveform": waveform, "sample_rate": sample_rate})

    # Newer pyannote.audio versions wrap the result in a DiarizeOutput
    # object instead of returning the raw Annotation directly.
    diarization = getattr(result, "speaker_diarization", result)
    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "speaker": speaker,
            "start": round(turn.start, 2),
            "end": round(turn.end, 2),
        })
    return segments