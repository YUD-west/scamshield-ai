"""Homoglyph detection, Punycode analysis, and domain entropy calculations."""

import math
import re
from typing import Dict, List, Optional, Set, Tuple

# Common homoglyph mappings (Non-ASCII Cyrillic, Greek, or special lookalikes mapped to Latin ASCII)
HOMOGLYPH_MAP: Dict[str, str] = {
    # Cyrillic
    "\u0430": "a",  # Cyrillic small letter a
    "\u0441": "c",  # Cyrillic small letter es
    "\u0435": "e",  # Cyrillic small letter ie
    "\u0456": "i",  # Cyrillic small letter byelorussian-ukrainian i
    "\u0458": "j",  # Cyrillic small letter je
    "\u043e": "o",  # Cyrillic small letter o
    "\u0440": "p",  # Cyrillic small letter er
    "\u0455": "s",  # Cyrillic small letter dze
    "\u0443": "y",  # Cyrillic small letter u
    "\u0445": "x",  # Cyrillic small letter ha
    "\u0410": "A",  # Cyrillic capital letter A
    "\u0412": "B",  # Cyrillic capital letter Ve
    "\u0421": "C",  # Cyrillic capital letter Es
    "\u0415": "E",  # Cyrillic capital letter Ie
    "\u041d": "H",  # Cyrillic capital letter En
    "\u0406": "I",  # Cyrillic capital letter Byelorussian-Ukrainian I
    "\u041e": "O",  # Cyrillic capital letter O
    "\u0420": "P",  # Cyrillic capital letter Er
    "\u0422": "T",  # Cyrillic capital letter Te
    "\u0425": "X",  # Cyrillic capital letter Ha
    # Greek
    "\u03b1": "a",  # Greek small letter alpha
    "\u03b5": "e",  # Greek small letter epsilon
    "\u03b9": "i",  # Greek small letter iota
    "\u03bf": "o",  # Greek small letter omicron
    "\u03c1": "p",  # Greek small letter rho
    "\u03c5": "u",  # Greek small letter upsilon
}

HIGH_VALUE_TARGETS: Set[str] = {
    "paypal", "apple", "microsoft", "google", "amazon", "netflix",
    "bankofamerica", "chase", "wellsfargo", "citi", "binance",
    "coinbase", "meta", "facebook", "instagram", "whatsapp",
    "usps", "fedex", "dhl", "ups", "irs", "gov", "microsoftonline",
    "outlook", "gmail", "yahoo", "icloud"
}

HIGH_RISK_TLDS: Set[str] = {
    "top", "xyz", "buzz", "cfd", "sbs", "rest", "surf", "icu",
    "monster", "work", "fit", "gq", "ml", "tk", "ga", "cf", "cam"
}

LEETSPEAK_MAP: Dict[str, str] = {
    "1": "l",
    "0": "o",
    "5": "s",
    "3": "e",
    "4": "a",
    "8": "b",
    "@": "a",
}


def normalize_leetspeak(text: str) -> str:
    """Translate common leetspeak substitutions to standard Latin characters."""
    normalized = text.lower().replace("vv", "w").replace("rn", "m")
    for char, replacement in LEETSPEAK_MAP.items():
        normalized = normalized.replace(char, replacement)
    return normalized


def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute Levenshtein distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = list(range(len(s2) + 1))
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def calculate_shannon_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string to detect randomness or obfuscation."""
    if not text:
        return 0.0
    entropy = 0.0
    text_len = len(text)
    frequencies: Dict[str, int] = {}
    for char in text:
        frequencies[char] = frequencies.get(char, 0) + 1
    for count in frequencies.values():
        prob = count / text_len
        entropy -= prob * math.log2(prob)
    return round(entropy, 3)


def detect_homoglyphs(domain: str) -> Tuple[bool, Optional[str], List[str]]:
    """Inspect domain for homoglyphs (both unicode and punycode xn-- forms).

    Returns:
        (has_homoglyph, normalized_latin_equivalent, detected_substitutions)
    """
    has_homoglyphs = False
    detected: List[str] = []
    decoded_domain = domain

    # Handle Punycode domains (e.g. xn--pypal-4ve.com)
    if "xn--" in domain.lower():
        try:
            decoded_domain = domain.encode("ascii").decode("idna")
            if decoded_domain != domain:
                has_homoglyphs = True
                detected.append(f"Punycode encoded domain decodes to: {decoded_domain}")
        except Exception:
            has_homoglyphs = True
            detected.append("Punycode decoding failed or malformed")

    # Inspect characters
    latinized_chars = []
    for char in decoded_domain:
        if char in HOMOGLYPH_MAP:
            has_homoglyphs = True
            sub = HOMOGLYPH_MAP[char]
            detected.append(f"Lookalike character '{char}' (U+{ord(char):04X}) mimics Latin '{sub}'")
            latinized_chars.append(sub)
        else:
            latinized_chars.append(char)

    normalized_latin = "".join(latinized_chars) if has_homoglyphs else None
    return has_homoglyphs, normalized_latin, detected


def check_target_impersonation(domain: str) -> Optional[Tuple[str, str]]:
    """Check if the domain mimics a trusted brand via typosquatting, subdomains, or hyphenation.

    Example: `paypal-security-update.com` or `login.paypal.com.verify-user.net`
    """
    clean_domain = domain.lower()
    # Remove port if present
    if ":" in clean_domain:
        clean_domain = clean_domain.split(":")[0]

    parts = clean_domain.split(".")
    # If standard domain structure: [subdomains..., second_level, tld]
    if len(parts) >= 2:
        root_name = parts[-2]
    else:
        root_name = clean_domain

    for target in HIGH_VALUE_TARGETS:
        # 1. Check if target is in the root domain name with hyphens or prefixes
        # e.g., 'paypal-update' or 'verify-apple' while root_name != target
        if target in root_name and root_name != target:
            return (
                target,
                f"Domain '{clean_domain}' embeds trusted brand '{target}' within '{root_name}'"
            )

        # 2. Check leetspeak substitutions in root domain name (e.g. 'paypa1' or 'amaz0n')
        normalized_root = normalize_leetspeak(root_name)
        if normalized_root != root_name:
            if normalized_root == target:
                return (
                    target,
                    f"Domain root '{root_name}' uses leetspeak substitution to mimic brand '{target}'"
                )
            if target in normalized_root and root_name != target:
                return (
                    target,
                    f"Domain root '{root_name}' embeds brand '{target}' via leetspeak characters"
                )

        # 3. Check for close typosquatting / distance-1 typos (e.g. 'paypall', 'gooogle', 'amazn')
        if len(root_name) >= 4 and len(target) >= 4 and abs(len(root_name) - len(target)) <= 1:
            if root_name != target and levenshtein_distance(root_name, target) == 1:
                return (
                    target,
                    f"Domain root '{root_name}' is a close typosquatting variant of brand '{target}'"
                )

        # 4. Check if trusted brand is embedded as a misleading subdomain:
        # e.g., 'paypal.com.scam-domain.com'
        if len(parts) > 2:
            subdomains = parts[:-2]
            for sub in subdomains:
                sub_norm = normalize_leetspeak(sub)
                if sub == target or sub_norm == target or f"{target}-" in sub or f"-{target}" in sub:
                    return (
                        target,
                        f"Subdomain '{sub}' impersonates trusted brand '{target}' on external host '{parts[-2]}.{parts[-1]}'"
                    )

    return None
