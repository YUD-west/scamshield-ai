"""Input sanitization and PII masking utilities."""

import re
from typing import List

# Regular expression to extract URLs from text
URL_REGEX = re.compile(
    r"""(?i)\b((?:https?://|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))"""
)


def sanitize_input_text(text: str, max_length: int = 10000) -> str:
    """Normalize input text, eliminate dangerous control bytes, and enforce length boundaries."""
    if not text:
        return ""
    # Strip null bytes and control chars except newlines and tabs
    cleaned = "".join(ch for ch in text if ch in ("\n", "\r", "\t") or (ch >= " " and ord(ch) != 127))
    return cleaned[:max_length].strip()


def extract_urls_from_text(text: str) -> List[str]:
    """Find and extract all potential URLs or domains from a text body."""
    matches = URL_REGEX.findall(text)
    urls = []
    for match in matches:
        raw_url = match[0]
        if raw_url:
            urls.append(raw_url)
    # Deduplicate while preserving order
    seen = set()
    deduped = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            deduped.append(u)
    return deduped


def mask_sensitive_snippet(text: str) -> str:
    """Mask email addresses, phone numbers, and potential credentials inside evidence snippets."""
    if not text:
        return ""
    # Mask emails: user@domain.com -> u***@domain.com
    text = re.sub(
        r"\b([A-Za-z0-9])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b",
        r"\1***\2",
        text
    )
    # Mask phone numbers: +1 (555) 123-4567 -> +1 (555) ***-4567
    text = re.sub(
        r"(\(?\d{3}\)?[ -]?)\d{3}([ -]?\d{4})",
        r"\1***\2",
        text
    )
    # Mask 16-digit cards: 1234-5678-9012-3456 -> 1234-****-****-3456
    text = re.sub(
        r"\b(\d{4})[ -]?(?:\d{4}[ -]?){2}(\d{4})\b",
        r"\1-****-****-\2",
        text
    )
    return text
