"""Unit tests for the Text Threat Analysis Engine."""

import pytest
from app.models.schemas import TextAnalysisRequest
from app.models.threat_types import RiskSeverity, ThreatCategory
from app.services.text_analyzer import text_analyzer


def test_violent_threat_detection():
    request = TextAnalysisRequest(
        content="I will hunt you down and kill you if you don't answer right now."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.VIOLENT_THREAT
    assert result.severity == RiskSeverity.CRITICAL
    assert result.confidence >= 0.80
    assert any("violence" in e.description.lower() or "threat" in e.description.lower() for e in result.evidence)
    assert any("emergency services" in r.action.lower() for r in result.recommendations)


def test_kidnapping_threat_detection():
    request = TextAnalysisRequest(
        content="We have your child and have taken them hostage. Pay immediately or you won't see them."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.VIOLENT_THREAT
    assert result.severity == RiskSeverity.CRITICAL
    assert any("hostage" in e.description.lower() or "kidnap" in e.description.lower() for e in result.evidence)


def test_webcam_extortion_sextortion():
    request = TextAnalysisRequest(
        content="I have recorded you on webcam watching dirty videos. Send $500 in bitcoin to avoid leak to all your contacts."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.COERCION_EXTORTION
    assert result.severity in (RiskSeverity.CRITICAL, RiskSeverity.HIGH)
    assert any("extortion" in r.rationale.lower() or "not pay" in r.action.lower() for r in result.recommendations)


def test_phishing_account_suspension():
    request = TextAnalysisRequest(
        content="URGENT: Unauthorized login detected. Your account is suspended. Verify your account at https://secure-login-check.com",
        sender_hint="security-team@mail-update.com"
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category in (ThreatCategory.PHISHING, ThreatCategory.IMPERSONATION)
    assert result.severity == RiskSeverity.HIGH
    assert len(result.extracted_urls) == 1
    assert "https://secure-login-check.com" in result.extracted_urls


def test_otp_credential_harvesting():
    request = TextAnalysisRequest(
        content="Bank Security: We sent a one-time passcode to your mobile. Please reply with your 2FA OTP code to cancel transfer."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category in (ThreatCategory.CREDENTIAL_HARVESTING, ThreatCategory.PHISHING)
    assert result.severity == RiskSeverity.HIGH


def test_crypto_financial_fraud():
    request = TextAnalysisRequest(
        content="Exclusive opportunity: Guaranteed returns! Double your bitcoin in 24 hours with our crypto investment bot."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.FINANCIAL_FRAUD
    assert result.severity == RiskSeverity.HIGH
    assert any("gift card" in r.action.lower() or "cryptocurrency" in r.action.lower() for r in result.recommendations)


def test_gift_card_scam():
    request = TextAnalysisRequest(
        content="I am stuck in a meeting, please buy target gift cards right now and send photos of the back."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.FINANCIAL_FRAUD
    assert result.severity == RiskSeverity.HIGH


def test_government_impersonation():
    request = TextAnalysisRequest(
        content="This is the Internal Revenue Service. There is an active warrant for your arrest due to unpaid federal taxes. Call immediately.",
        sender_hint="irs-badge-officer@gmail.com"
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.IMPERSONATION
    assert result.severity == RiskSeverity.HIGH


def test_benign_message():
    request = TextAnalysisRequest(
        content="Hi Alex, are we still meeting tomorrow for coffee around 10am? Let me know if that works."
    )
    result = text_analyzer.analyze(request)

    assert result.is_threat is False
    assert result.primary_category == ThreatCategory.BENIGN
    assert result.severity == RiskSeverity.INFORMATIONAL
    assert len(result.extracted_urls) == 0
    assert result.confidence >= 0.70
