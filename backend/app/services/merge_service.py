def merge_transcript_with_speakers(transcript_segments, diarization_segments):
    """
    Lines up Whisper's text segments with pyannote's speaker segments
    by finding which speaker turn overlaps most with each piece of text.

    Returns a list like:
    [{"speaker": "Speaker 1", "text": "Let's ship by Friday.", "start": 0.0, "end": 4.2}, ...]
    """
    if not diarization_segments:
        # No diarization available — fall back to a single unlabeled speaker
        return [
            {"speaker": "Speaker 1", "text": s["text"], "start": s["start"], "end": s["end"]}
            for s in transcript_segments
        ]

    # Map raw labels like SPEAKER_00 -> friendly "Speaker 1", "Speaker 2", etc.
    label_map = {}
    next_number = 1

    def friendly_name(raw_label):
        nonlocal next_number
        if raw_label not in label_map:
            label_map[raw_label] = f"Speaker {next_number}"
            next_number += 1
        return label_map[raw_label]

    merged = []
    for seg in transcript_segments:
        seg_mid = (seg["start"] + seg["end"]) / 2

        # Find the diarization turn whose time range contains this segment's midpoint
        best_match = None
        for d in diarization_segments:
            if d["start"] <= seg_mid <= d["end"]:
                best_match = d
                break

        if best_match is None:
            # Fallback: pick the diarization segment with the closest start time
            best_match = min(diarization_segments, key=lambda d: abs(d["start"] - seg["start"]))

        speaker = friendly_name(best_match["speaker"])

        # Merge consecutive segments from the same speaker into one block
        if merged and merged[-1]["speaker"] == speaker:
            merged[-1]["text"] += " " + seg["text"]
            merged[-1]["end"] = seg["end"]
        else:
            merged.append({
                "speaker": speaker,
                "text": seg["text"],
                "start": seg["start"],
                "end": seg["end"],
            })

    return merged