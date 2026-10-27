"""ScamShield AI Backend Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import InMemoryRateLimiter, SecurityHeadersMiddleware

logger = get_logger("scamshield.main")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "ScamShield AI is an automated threat triage and incident response assistant. "
        "Provides non-executing text and URL inspection, risk simulation, and evidence capture."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

# Register Security Hardening & Rate Limiting Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    InMemoryRateLimiter,
    max_requests=settings.RATE_LIMIT_PER_MINUTE,
    window_seconds=60
)

# Configure Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs"
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting ScamShield AI server on port 8000...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
