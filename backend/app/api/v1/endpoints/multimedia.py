"""Multimedia safe inspection endpoint."""

import base64
from fastapi import APIRouter, HTTPException, status
from app.core.logging import get_logger
from app.models.schemas import (
    MultimediaInspectRequest,
    MultimediaInspectResult,
    TextAnalysisRequest,
)
from app.services.boundaries.multimedia_boundary import multimedia_service
from app.services.text_analyzer import text_analyzer

router = APIRouter(prefix="/media", tags=["Multimedia Boundary"])
logger = get_logger("scamshield.api.multimedia")


@router.post("/inspect", response_model=MultimediaInspectResult, status_code=status.HTTP_200_OK)
def inspect_media(request: MultimediaInspectRequest) -> MultimediaInspectResult:
    """Safely inspect uploaded screenshots, media, or voicemails without code execution.

    Extracts text/URLs where supported and evaluates against text threat engines.
    Clearly marks boundary status for future audio/deepfake models.
    """
    try:
        # Decode base64 payload safely
        try:
            content_bytes = base64.b64decode(request.content_base64)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid base64 payload provided."
            )

        meta = multimedia_service.inspect_media_metadata(
            filename=request.filename,
            content_bytes=content_bytes,
            mime_type=request.mime_type
        )

        extracted_text = None
        extracted_urls = []
        status_note = ""

        if request.mime_type.startswith("image/"):
            extracted_text, extracted_urls, status_note = multimedia_service.process_image(
                filename=request.filename,
                content_bytes=content_bytes,
                mime_type=request.mime_type
            )
        elif request.mime_type.startswith("audio/"):
            extracted_text, status_note = multimedia_service.process_audio_voicemail(
                filename=request.filename,
                content_bytes=content_bytes,
                mime_type=request.mime_type
            )
        else:
            status_note = f"UNSUPPORTED_MEDIA_MIME_TYPE: {request.mime_type}"

        # If text was extracted, evaluate through text_analyzer
        threat_assessment = None
        if extracted_text and not meta["is_suspicious_extension"]:
            threat_assessment = text_analyzer.analyze(
                TextAnalysisRequest(content=extracted_text, platform=f"Media: {request.filename}")
            )

        logger.info(
            f"Inspected media: file={request.filename}, mime={request.mime_type}, "
            f"size={meta['file_size_bytes']}B, sha256={meta['sha256_checksum'][:12]}..."
        )

        return MultimediaInspectResult(
            filename=request.filename,
            mime_type=request.mime_type,
            file_size_bytes=meta["file_size_bytes"],
            sha256_checksum=meta["sha256_checksum"],
            extracted_text=extracted_text,
            extracted_urls=extracted_urls,
            threat_assessment=threat_assessment,
            integration_status=status_note,
            is_suspicious_extension=meta["is_suspicious_extension"],
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Media inspection failure: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while inspecting the submitted media artifact."
        )
