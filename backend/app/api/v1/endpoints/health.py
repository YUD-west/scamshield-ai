"""Health check and service status endpoint."""

from fastapi import APIRouter
from app.core.config import settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return runtime health status and active protection services."""
    return HealthResponse(
        status="operational",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        analyzers_ready=True,
        active_services=[
            "text_threat_analyzer",
            "safe_url_analyzer",
            "homoglyph_engine",
            "threat_intelligence_boundary"
        ]
    )
