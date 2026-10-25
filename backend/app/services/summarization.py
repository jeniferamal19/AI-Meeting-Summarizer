import json
from groq import Groq
from app.core.config import GROQ_API_KEY
from app.models.schemas import MeetingSummary

client = Groq(api_key=GROQ_API_KEY)

# Tries models in order — uses the first one that works
MODELS_TO_TRY = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "openai/gpt-oss-120b",
]

SYSTEM_PROMPT = """You are an expert meeting-minutes writer. You read raw meeting transcripts and output ONLY valid JSON (no markdown, no commentary) in this exact shape:

{
  "summary": "2-4 sentence plain-English overview of what happened in the meeting",
  "key_decisions": ["decision 1", "decision 2"],
  "risks_blockers": ["risk or blocker 1", "risk or blocker 2"],
  "action_items": [
    {"task": "what needs to be done", "owner": "person responsible or null", "due": "deadline mentioned or null"}
  ],
  "topics_discussed": ["topic 1", "topic 2"]
}

Rules:
- Always return all five keys, even if a list is empty ([]).
- Only include decisions, risks, action items, or topics actually supported by the transcript.
- owner and due should be null if not mentioned.
- Do not invent facts not in the transcript.
"""

def _extract_json(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


def summarize_text(transcript: str) -> MeetingSummary:
    last_error = None

    for model in MODELS_TO_TRY:
        try:
            response = client.chat.completions.create(
                model=model,
                response_format={"type": "json_object"},
                max_tokens=2048,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Transcript:\n{transcript}"},
                ],
            )
            raw = response.choices[0].message.content
            try:
                data = json.loads(_extract_json(raw))
            except json.JSONDecodeError:
                data = {
                    "summary": raw,
                    "key_decisions": [],
                    "risks_blockers": [],
                    "action_items": [],
                    "topics_discussed": [],
                }
            return MeetingSummary(**data)
        except Exception as e:
            print(f"Model {model} failed: {e}")
            last_error = e
            continue

    raise last_error