"""Pydantic schemas for request and response data models."""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, HttpUrl, field_validator

from app.models.threat_types import EvidenceItem, RiskSeverity, ThreatCategory


class TextAnalysisRequest(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="The suspicious text message, email body, or communication to inspect"
    )
    sender_hint: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional sender address, name, or handle provided by the user"
    )
    platform: Optional[str] = Field(
        None,
        max_length=50,
        description="Optional context such as SMS, WhatsApp, Email, Discord, Telegram"
    )

    @field_validator("content")
    @classmethod
    def validate_content_not_empty(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Analysis content cannot be empty or solely whitespace.")
        return stripped


class UrlAnalysisRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=3,
        max_length=2048,
        description="The URL to inspect safely without opening"
    )

    @field_validator("url")
    @classmethod
    def validate_url_syntax(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("URL cannot be empty.")
        # Ensure it has at least a domain or scheme
        if not ("://" in stripped or "." in stripped):
            raise ValueError("Invalid URL format. Must contain a valid domain or scheme.")
        return stripped


class ProtectionRecommendation(BaseModel):
    priority: str = Field(..., description="URGENT, RECOMMENDED, or ADVISORY")
    action: str = Field(..., description="Actionable protective step")
    rationale: str = Field(..., description="Why this step is critical for this threat")


class TextAnalysisResult(BaseModel):
    is_threat: bool
    primary_category: ThreatCategory
    secondary_categories: List[ThreatCategory] = Field(default_factory=list)
    severity: RiskSeverity = Field(..., description="Potential harm severity: CRITICAL, HIGH, MEDIUM, LOW, INFORMATIONAL")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model analytical confidence (0.00 to 1.00)")
    summary: str = Field(..., description="Plain-language explanation of findings")
    evidence: List[EvidenceItem] = Field(default_factory=list)
    recommendations: List[ProtectionRecommendation] = Field(default_factory=list)
    extracted_urls: List[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default="ScamShield AI provides automated threat assessments based on observed patterns. Exercise caution and verify independently."
    )
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UrlAnalysisResult(BaseModel):
    is_threat: bool
    original_input: str
    normalized_url: str
    domain: str
    is_ip_address: bool = False
    has_homoglyphs: bool = False
    punycode_decoded: Optional[str] = None
    is_suspicious_tld: bool = False
    shannon_entropy: float = Field(..., description="Path and query entropy metric")
    severity: RiskSeverity
    confidence: float = Field(..., ge=0.0, le=1.0)
    primary_category: ThreatCategory
    summary: str
    evidence: List[EvidenceItem] = Field(default_factory=list)
    recommendations: List[ProtectionRecommendation] = Field(default_factory=list)
    threat_intel_match: bool = False
    threat_intel_source: Optional[str] = None
    disclaimer: str = Field(
        default="URL inspected passively via structural and threat heuristics without opening or executing destination code."
    )
    analyzed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    environment: str
    analyzers_ready: bool = True
    active_services: List[str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
