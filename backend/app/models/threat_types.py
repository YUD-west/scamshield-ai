"""Threat types, severity levels, and classification categories for ScamShield AI."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RiskSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFORMATIONAL = "INFORMATIONAL"


class ThreatCategory(str, Enum):
    BENIGN = "BENIGN"
    PHISHING = "PHISHING"
    IMPERSONATION = "IMPERSONATION"
    FINANCIAL_FRAUD = "FINANCIAL_FRAUD"
    COERCION_EXTORTION = "COERCION_EXTORTION"
    VIOLENT_THREAT = "VIOLENT_THREAT"
    CREDENTIAL_HARVESTING = "CREDENTIAL_HARVESTING"
    MALICIOUS_LINK = "MALICIOUS_LINK"
    SUSPICIOUS_URGENCY = "SUSPICIOUS_URGENCY"


class IndicatorType(str, Enum):
    KEYWORD_PATTERN = "KEYWORD_PATTERN"
    HOMOGLYPH_DECEPTION = "HOMOGLYPH_DECEPTION"
    SUSPICIOUS_TLD = "SUSPICIOUS_TLD"
    IP_HOST = "IP_HOST"
    HIGH_ENTROPY_URL = "HIGH_ENTROPY_URL"
    PRESSURE_TACTIC = "PRESSURE_TACTIC"
    FINANCIAL_TRIGGER = "FINANCIAL_TRIGGER"
    AUTHORITY_CLAIM = "AUTHORITY_CLAIM"
    THREAT_LANGUAGE = "THREAT_LANGUAGE"
    LOOKALIKE_DOMAIN = "LOOKALIKE_DOMAIN"


class EvidenceItem(BaseModel):
    indicator_type: IndicatorType
    title: str = Field(..., description="Short summary of the indicator")
    description: str = Field(..., description="Clear explanation of why this indicator is suspicious")
    matched_pattern: Optional[str] = Field(None, description="Sanitized matched string or rule name")
    severity_contribution: RiskSeverity = Field(
        default=RiskSeverity.LOW,
        description="The severity level associated specifically with this indicator"
    )
