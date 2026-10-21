"""PII-safe structured logging utility.

Ensures sensitive details like credentials, email addresses, phone numbers,
and financial accounts are never leaked into server logs.
"""

import logging
import re
import sys
from typing import Any

# Regex patterns for sensitive identifiers
PII_PATTERNS = [
    # Credit Card Numbers (13-19 digits with optional hyphens/spaces)
    (re.compile(r"\b(?:\d{4}[ -]?){3}\d{4}\b"), "[REDACTED_CREDIT_CARD]"),
    # Social Security Numbers / National IDs (XXX-XX-XXXX)
    (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "[REDACTED_SSN]"),
    # Email addresses
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"), "[REDACTED_EMAIL]"),
    # Phone numbers (various formats)
    (re.compile(r"(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}\b"), "[REDACTED_PHONE]"),
    # Cryptocurrency wallet addresses (e.g. Bitcoin, Ethereum)
    (re.compile(r"\b(?:1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,39}\b"), "[REDACTED_CRYPTO_ADDRESS]"),
    (re.compile(r"\b0x[a-fA-F0-9]{40}\b"), "[REDACTED_ETH_ADDRESS]"),
    # Passwords or tokens in key-value format
    (re.compile(r'(?i)(password|secret|token|api[_-]?key|auth|bearer)\s*[:=]\s*["\']?([^"\'\s]+)["\']?'), r"\1=[REDACTED_SECRET]"),
]


def redact_pii(message: str) -> str:
    """Scrub sensitive information from the log string."""
    if not isinstance(message, str):
        message = str(message)
    for pattern, replacement in PII_PATTERNS:
        message = pattern.sub(replacement, message)
    return message


class SafeFormatter(logging.Formatter):
    """Custom logging formatter that strips PII before outputting."""

    def format(self, record: logging.LogRecord) -> str:
        orig_msg = record.getMessage()
        sanitized_msg = redact_pii(orig_msg)
        # Temporarily swap message for formatting
        record.msg = sanitized_msg
        record.args = ()
        formatted = super().format(record)
        return formatted


def get_logger(name: str) -> logging.Logger:
    """Configure and retrieve a PII-scrubbed logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(
            SafeFormatter(
                fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
                datefmt="%Y-%m-%dT%H:%M:%SZ"
            )
        )
        logger.addHandler(handler)
        logger.propagate = False
    return logger
