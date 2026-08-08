from app.services.diarization import diarize_audio

segments = diarize_audio("uploads/rich_meeting_test_audio.wav")

for s in segments:
    print(f"{s['speaker']}: {s['start']}s - {s['end']}s")