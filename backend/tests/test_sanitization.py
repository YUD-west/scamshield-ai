"""Unit tests for PII redaction and input sanitization routines."""

import pytest
from app.core.logging import redact_pii
from app.utils.sanitizers import extract_urls_from_text, mask_sensitive_snippet, sanitize_input_text


def test_pii_redaction_credit_card():
    raw = "User submitted credit card 4111 2222 3333 4444 for verification."
    redacted = redact_pii(raw)
    assert "4111 2222 3333 4444" not in redacted
    assert "[REDACTED_CREDIT_CARD]" in redacted


def test_pii_redaction_ssn():
    raw = "SSN provided was 000-12-3456 during application."
    redacted = redact_pii(raw)
    assert "000-12-3456" not in redacted
    assert "[REDACTED_SSN]" in redacted


def test_pii_redaction_email():
    raw = "Contact support at customer.victim@private-domain.com for details."
    redacted = redact_pii(raw)
    assert "customer.victim@private-domain.com" not in redacted
    assert "[REDACTED_EMAIL]" in redacted


def test_pii_redaction_crypto_address():
    raw = "Please send ransom to 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa immediately."
    redacted = redact_pii(raw)
    assert "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" not in redacted
    assert "[REDACTED_CRYPTO_ADDRESS]" in redacted


def test_pii_redaction_credentials():
    raw = "Debug event: password='SuperSecretPassword123' and token='xyz-987-abc'"
    redacted = redact_pii(raw)
    assert "SuperSecretPassword123" not in redacted
    assert "[REDACTED_SECRET]" in redacted


def test_control_character_stripping():
    malicious_input = "Hello\x00World\x08Test\nNormal text"
    sanitized = sanitize_input_text(malicious_input)
    assert "\x00" not in sanitized
    assert "\x08" not in sanitized
    assert "Normal text" in sanitized


def test_url_extraction_multiple():
    message = (
        "Check this out: https://phish-site.com/login and also click "
        "http://tracking-link.org/click?id=123 for more info."
    )
    urls = extract_urls_from_text(message)
    assert len(urls) == 2
    assert "https://phish-site.com/login" in urls
    assert "http://tracking-link.org/click?id=123" in urls
