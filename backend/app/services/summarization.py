import json

from groq import Groq

from app.core.config import GROQ_API_KEY
from app.models.schemas import MeetingSummary

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = SYSTEM_PROMPT = """You are an expert meeting-minutes writer. You read raw meeting transcripts and output ONLY valid JSON (no markdown, no commentary) in this exact shape:

{
  "summary": "2-4 sentence plain-English overview of what happened in the meeting",
  "key_decisions": ["decision 1", "decision 2"],
  "risks_blockers": ["risk or blocker 1", "risk or blocker 2"],
  "action_items": [
    {"task": "what needs to be done", "owner": "person responsible or null", "due": "deadline mentioned or null"}
  ],
  "topics_discussed": ["topic 1", "topic 2"]
}

A "risk or blocker" is anything that could delay, stop, or complicate progress — a dependency on another team, a missing resource, an unresolved disagreement, a technical issue, or anything explicitly described as "blocked," "stuck," "waiting on," or "at risk."

Rules:
- Always return all five keys, even if a list is empty ([]).
- Only include decisions, risks, action items, or topics that are actually supported by the transcript.
- "owner" and "due" should be null if the transcript does not mention them.
- Do not invent names, dates, or facts that are not in the transcript.
"""

def _extract_json(raw: str) -> str:
    """Groq's JSON mode normally returns clean JSON, but if the model
    wraps it in a markdown code fence anyway, strip that before parsing."""
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


def summarize_text(transcript: str) -> MeetingSummary:
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Transcript:\n{transcript}"},
        ],
    )

    raw = response.choices[0].message.content

    try:
        data = json.loads(_extract_json(raw))
    except json.JSONDecodeError:
        # Fallback so a bad parse doesn't crash the request — the user
        # still gets something useful instead of a 500 error.
        data = {
            "summary": raw,
            "key_decisions": [],
            "action_items": [],
            "topics_discussed": [],
        }

    return MeetingSummary(**data)