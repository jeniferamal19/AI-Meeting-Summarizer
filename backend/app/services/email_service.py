import json

from groq import Groq

from app.core.config import GROQ_API_KEY
from app.models.schemas import MeetingSummary, FollowUpEmail

client = Groq(api_key=GROQ_API_KEY)

SYSTEM_PROMPT = """You are an expert executive assistant who writes concise, professional follow-up emails after meetings. You read a structured meeting summary and output ONLY valid JSON (no markdown, no commentary) in this exact shape:

{
  "subject": "short, specific subject line for the follow-up email",
  "body": "the full email body, plain text, with a greeting, a short recap, bullet-style action items with owners if known, and a brief closing line"
}

Rules:
- Keep the tone professional but warm, like a real teammate wrote it.
- Only reference decisions, risks, and action items that are actually present in the summary provided.
- If there are no action items, don't invent any — just note that no action items were assigned.
- Do not use markdown formatting like ** or # in the body; write plain text suitable for pasting into an email client. Use "-" for bullet points.
- Keep the body under 200 words.
"""

def _extract_json(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return text.strip()


def generate_followup_email(summary: MeetingSummary) -> FollowUpEmail:
    response = client.chat.completions.create(
        model="qwen/qwen3.8-27b",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Meeting summary JSON:\n{summary.model_dump_json()}"},
        ],
    )

    raw = response.choices[0].message.content

    try:
        data = json.loads(_extract_json(raw))
    except json.JSONDecodeError:
        data = {
            "subject": "Meeting Follow-up",
            "body": raw,
        }

    return FollowUpEmail(**data)