"""Application configuration settings using pydantic-settings."""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "ScamShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Security & CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Privacy & Logging
    REDACT_PII_IN_LOGS: bool = True
    MAX_TEXT_ANALYSIS_LENGTH: int = 10000

    # Rate Limiting (Requests per minute)
    RATE_LIMIT_PER_MINUTE: int = 60

    # External Threat Intelligence APIs (Optional)
    # If keys are not provided, system operates using local verified threat signature engine
    GOOGLE_SAFE_BROWSING_API_KEY: Optional[str] = None
    VIRUSTOTAL_API_KEY: Optional[str] = None
    ENABLE_EXTERNAL_INTEL: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
