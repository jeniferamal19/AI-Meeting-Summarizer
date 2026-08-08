from fastapi import APIRouter, Response

from app.models.schemas import MeetingSummary
from app.services.export_service import build_pdf, build_docx

router = APIRouter(prefix="/api/export")


@router.post("/pdf")
def export_pdf(summary: MeetingSummary):
    pdf_bytes = build_pdf(summary)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=meeting-notes.pdf"},
    )


@router.post("/docx")
def export_docx(summary: MeetingSummary):
    docx_bytes = build_docx(summary)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=meeting-notes.docx"},
    )