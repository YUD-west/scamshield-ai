"""Unit tests for the Safe Non-Executing URL Analysis Engine."""

import pytest
from app.models.schemas import UrlAnalysisRequest
from app.models.threat_types import RiskSeverity, ThreatCategory
from app.services.url_analyzer import url_analyzer


def test_direct_ip_url():
    request = UrlAnalysisRequest(url="http://192.168.1.50/admin-login")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.is_ip_address is True
    assert result.severity == RiskSeverity.HIGH
    assert any("direct ip" in e.title.lower() for e in result.evidence)


def test_homoglyph_cyrillic_lookalike():
    # 'pаypal.com' with Cyrillic 'а' (U+0430)
    request = UrlAnalysisRequest(url="https://p\u0430ypal.com/update-security")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.has_homoglyphs is True
    assert result.punycode_decoded == "paypal.com"
    assert result.severity == RiskSeverity.HIGH
    assert any("lookalike" in e.title.lower() or "homoglyph" in e.title.lower() for e in result.evidence)


def test_punycode_encoded_domain():
    # xn--pypal-4ve.com is IDN for pаypal.com
    request = UrlAnalysisRequest(url="http://xn--pypal-4ve.com/login")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.has_homoglyphs is True
    assert result.severity == RiskSeverity.HIGH


def test_brand_typosquatting_subdomain():
    request = UrlAnalysisRequest(url="https://paypal-security-update.com/signin")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category == ThreatCategory.IMPERSONATION
    assert result.severity == RiskSeverity.HIGH
    assert any("paypal" in e.description.lower() for e in result.evidence)


def test_suspicious_tld():
    request = UrlAnalysisRequest(url="https://bonus-claim-portal.xyz/reward")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.is_suspicious_tld is True
    assert result.severity in (RiskSeverity.MEDIUM, RiskSeverity.HIGH)
    assert any(".xyz" in e.title for e in result.evidence)


def test_confirmed_threat_intel_match():
    # Mock feed has 'evil-phish-bank.com' registered as active phishing
    request = UrlAnalysisRequest(url="https://evil-phish-bank.com/session-restore")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.threat_intel_match is True
    assert result.severity == RiskSeverity.CRITICAL
    assert result.confidence >= 0.95
    assert "Known Phishing Campaign" in result.threat_intel_source


def test_leetspeak_typosquatting():
    # 'paypa1.com' uses number '1' instead of letter 'l'
    request = UrlAnalysisRequest(url="https://paypa1.com/login")
    result = url_analyzer.analyze(request)

    assert result.is_threat is True
    assert result.primary_category in (ThreatCategory.IMPERSONATION, ThreatCategory.PHISHING)
    assert result.severity in (RiskSeverity.HIGH, RiskSeverity.CRITICAL)
    assert any("paypal" in e.description.lower() or "mimic" in e.description.lower() for e in result.evidence)


def test_benign_clean_url():
    request = UrlAnalysisRequest(url="https://developer.mozilla.org/en-US/docs/Web/Security")
    result = url_analyzer.analyze(request)

    assert result.is_threat is False
    assert result.severity == RiskSeverity.INFORMATIONAL
    assert result.is_ip_address is False
    assert result.has_homoglyphs is False
    assert result.threat_intel_match is False
    assert result.confidence >= 0.80
