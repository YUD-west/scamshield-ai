"""Analysis endpoints for text threats and safe URL inspection."""

from fastapi import APIRouter, HTTPException, status
from app.core.logging import get_logger
from app.models.schemas import TextAnalysisRequest, TextAnalysisResult, UrlAnalysisRequest, UrlAnalysisResult
from app.services.text_analyzer import text_analyzer
from app.services.url_analyzer import url_analyzer

router = APIRouter(prefix="/analyze", tags=["Threat Analysis"])
logger = get_logger("scamshield.api.analyze")


@router.post("/text", response_model=TextAnalysisResult, status_code=status.HTTP_200_OK)
def analyze_text(request: TextAnalysisRequest) -> TextAnalysisResult:
    """Analyze text messages, emails, or communications for threats, scams, and extortion.

    Produces explainable evidence indicators, decoupled severity and confidence,
    and tailored mitigation recommendations.
    """
    try:
        # Audit log with safe redaction
        logger.info(
            f"Analyzing text submission (length: {len(request.content)}, platform: {request.sender_hint or 'unspecified'})"
        )
        result = text_analyzer.analyze(request)
        logger.info(
            f"Completed text analysis: category={result.primary_category.value}, severity={result.severity.value}, confidence={result.confidence}"
        )
        return result
    except Exception as exc:
        logger.error(f"Text analysis encountered an unexpected error: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while evaluating the submitted text."
        )


@router.post("/url", response_model=UrlAnalysisResult, status_code=status.HTTP_200_OK)
def analyze_url(request: UrlAnalysisRequest) -> UrlAnalysisResult:
    """Passively inspect a URL for homoglyphs, brand deception, and malicious indicators.

    Strictly inspects structure and threat feeds without following redirects
    or initiating HTTP network requests to destination servers.
    """
    try:
        logger.info(f"Analyzing URL submission: {request.url}")
        result = url_analyzer.analyze(request)
        logger.info(
            f"Completed URL analysis: domain={result.domain}, severity={result.severity.value}, threat={result.is_threat}"
        )
        return result
    except Exception as exc:
        logger.error(f"URL analysis encountered an unexpected error: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while inspecting the submitted URL."
        )
