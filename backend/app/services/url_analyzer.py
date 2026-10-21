"""Safe non-executing URL analysis engine for ScamShield AI.

Inspects URLs statically through structural, cryptographic entropy,
homoglyphic, and threat-intelligence heuristics.
Never connects to, downloads, or executes remote resources.
"""

import ipaddress
import re
from typing import List, Optional
from urllib.parse import urlparse

from app.models.schemas import ProtectionRecommendation, UrlAnalysisRequest, UrlAnalysisResult
from app.models.threat_types import EvidenceItem, IndicatorType, RiskSeverity, ThreatCategory
from app.services.boundaries.threat_intel import threat_intel_service
from app.utils.homoglyphs import (
    HIGH_RISK_TLDS,
    calculate_shannon_entropy,
    check_target_impersonation,
    detect_homoglyphs,
)


class SafeUrlAnalyzer:
    """Passively inspects URLs without initiating external HTTP connections."""

    def analyze(self, request: UrlAnalysisRequest) -> UrlAnalysisResult:
        raw_url = request.url.strip()
        normalized_url = raw_url

        # Ensure scheme is present for standard parsing
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", raw_url):
            normalized_url = "https://" + raw_url

        parsed = urlparse(normalized_url)
        domain = (parsed.hostname or "").lower()
        path = parsed.path or ""
        query = parsed.query or ""

        evidence_list: List[EvidenceItem] = []
        is_threat = False
        primary_category = ThreatCategory.BENIGN
        highest_severity = RiskSeverity.INFORMATIONAL
        confidence_points = 0.50

        severity_rank = {
            RiskSeverity.INFORMATIONAL: 0,
            RiskSeverity.LOW: 1,
            RiskSeverity.MEDIUM: 2,
            RiskSeverity.HIGH: 3,
            RiskSeverity.CRITICAL: 4,
        }

        # 1. IP-Host Address Detection
        is_ip_address = False
        try:
            ipaddress.ip_address(domain)
            is_ip_address = True
            evidence_list.append(
                EvidenceItem(
                    indicator_type=IndicatorType.IP_HOST,
                    title="Direct IP Address Host",
                    description="URL points directly to an IP address rather than a registered domain name, commonly used in phishing relays.",
                    matched_pattern=domain,
                    severity_contribution=RiskSeverity.HIGH
                )
            )
            is_threat = True
            primary_category = ThreatCategory.MALICIOUS_LINK
            highest_severity = RiskSeverity.HIGH
            confidence_points += 0.20
        except ValueError:
            is_ip_address = False

        # 2. Homoglyph and Punycode Inspection
        has_homoglyphs, latin_equiv, homoglyph_notes = detect_homoglyphs(domain)
        if has_homoglyphs:
            is_threat = True
            primary_category = ThreatCategory.PHISHING
            for note in homoglyph_notes:
                evidence_list.append(
                    EvidenceItem(
                        indicator_type=IndicatorType.HOMOGLYPH_DECEPTION,
                        title="Lookalike Homoglyph / Punycode Detected",
                        description=f"Domain employs deceptive visual lookalike characters: {note}",
                        matched_pattern=domain,
                        severity_contribution=RiskSeverity.HIGH
                    )
                )
            if severity_rank[RiskSeverity.HIGH] > severity_rank[highest_severity]:
                highest_severity = RiskSeverity.HIGH
            confidence_points += 0.30

        # 3. Brand Impersonation / Typosquatting
        impersonation = check_target_impersonation(domain)
        if impersonation:
            target_brand, imp_desc = impersonation
            is_threat = True
            primary_category = ThreatCategory.IMPERSONATION
            evidence_list.append(
                EvidenceItem(
                    indicator_type=IndicatorType.LOOKALIKE_DOMAIN,
                    title=f"Brand Deception: Mimics {target_brand.title()}",
                    description=imp_desc,
                    matched_pattern=domain,
                    severity_contribution=RiskSeverity.HIGH
                )
            )
            if severity_rank[RiskSeverity.HIGH] > severity_rank[highest_severity]:
                highest_severity = RiskSeverity.HIGH
            confidence_points += 0.25

        # 4. Suspicious TLD Analysis
        is_suspicious_tld = False
        tld = domain.split(".")[-1] if "." in domain else ""
        if tld in HIGH_RISK_TLDS:
            is_suspicious_tld = True
            is_threat = True
            if primary_category == ThreatCategory.BENIGN:
                primary_category = ThreatCategory.MALICIOUS_LINK
            evidence_list.append(
                EvidenceItem(
                    indicator_type=IndicatorType.SUSPICIOUS_TLD,
                    title=f"High-Risk Top-Level Domain (.{tld})",
                    description=f"The domain extension '.{tld}' is frequently associated with disposable, low-cost phishing campaigns.",
                    matched_pattern=f".{tld}",
                    severity_contribution=RiskSeverity.MEDIUM
                )
            )
            if severity_rank[RiskSeverity.MEDIUM] > severity_rank[highest_severity]:
                highest_severity = RiskSeverity.MEDIUM
            confidence_points += 0.20

        # 5. Shannon Entropy Calculation
        eval_string = path + ("?" + query if query else "")
        entropy = calculate_shannon_entropy(eval_string) if eval_string else 0.0
        if entropy > 4.2 and len(eval_string) > 20:
            evidence_list.append(
                EvidenceItem(
                    indicator_type=IndicatorType.HIGH_ENTROPY_URL,
                    title="High Shannon Entropy String",
                    description=f"URL path and query demonstrate high randomness (entropy: {entropy:.2f}), typical of tracking tokens or obfuscation.",
                    matched_pattern=f"Entropy score: {entropy:.2f}",
                    severity_contribution=RiskSeverity.LOW
                )
            )
            confidence_points += 0.10

        # 6. Threat Intelligence Query (Boundary)
        threat_match, threat_source = threat_intel_service.lookup_domain(domain)
        if not threat_match:
            threat_match, threat_source = threat_intel_service.lookup_url(normalized_url)

        if threat_match:
            is_threat = True
            highest_severity = RiskSeverity.CRITICAL
            confidence_points = 0.98
            evidence_list.insert(
                0,
                EvidenceItem(
                    indicator_type=IndicatorType.KEYWORD_PATTERN,
                    title="Known Malicious Indicator (Threat Intelligence)",
                    description=f"Destination matched confirmed malicious threat intelligence: {threat_source}",
                    matched_pattern=domain,
                    severity_contribution=RiskSeverity.CRITICAL
                )
            )

        # Finalize status
        confidence = min(0.99, max(0.60, confidence_points))
        if not is_threat:
            highest_severity = RiskSeverity.INFORMATIONAL
            confidence = 0.85
            summary = (
                f"No known malicious indicators or homoglyph spoofing detected for domain '{domain}'. "
                "Structure appears standard."
            )
        else:
            summary = self._build_url_summary(domain, highest_severity, primary_category, threat_match, evidence_list)

        recommendations = self._build_url_recommendations(is_threat, highest_severity, domain)

        return UrlAnalysisResult(
            is_threat=is_threat,
            original_input=raw_url,
            normalized_url=normalized_url,
            domain=domain,
            is_ip_address=is_ip_address,
            has_homoglyphs=has_homoglyphs,
            punycode_decoded=latin_equiv,
            is_suspicious_tld=is_suspicious_tld,
            shannon_entropy=entropy,
            severity=highest_severity,
            confidence=round(confidence, 2),
            primary_category=primary_category,
            summary=summary,
            evidence=evidence_list,
            recommendations=recommendations,
            threat_intel_match=threat_match,
            threat_intel_source=threat_source,
        )

    def _build_url_summary(
        self,
        domain: str,
        severity: RiskSeverity,
        category: ThreatCategory,
        threat_intel: bool,
        evidence: List[EvidenceItem]
    ) -> str:
        if threat_intel:
            return (
                f"CRITICAL THREAT: Domain '{domain}' is listed in verified threat intelligence feeds as actively malicious. "
                "Do not open, download from, or interact with this link."
            )
        if severity == RiskSeverity.HIGH:
            return (
                f"HIGH RISK: Domain '{domain}' exhibits deceptive structural traits ({len(evidence)} indicator(s) found), "
                "including possible brand impersonation or visual homoglyph spoofing."
            )
        elif severity == RiskSeverity.MEDIUM:
            return (
                f"SUSPICIOUS DOMAIN: '{domain}' displays anomalies such as a high-risk TLD or atypical subdomain nesting. "
                "Manual destination verification is recommended."
            )
        return f"LOW RISK: Minor structural flags observed on '{domain}'. Exercise normal caution."

    def _build_url_recommendations(
        self,
        is_threat: bool,
        severity: RiskSeverity,
        domain: str
    ) -> List[ProtectionRecommendation]:
        recs: List[ProtectionRecommendation] = []

        if not is_threat:
            recs.append(
                ProtectionRecommendation(
                    priority="ADVISORY",
                    action="Ensure SSL padlock and correct hostname in address bar",
                    rationale="Confirm the domain matches your intended service exactly before submitting credentials."
                )
            )
            return recs

        if severity in (RiskSeverity.CRITICAL, RiskSeverity.HIGH):
            recs.append(
                ProtectionRecommendation(
                    priority="URGENT",
                    action="Do NOT open or submit any credentials to this destination",
                    rationale="Opening this destination exposes you to credential theft and malicious session hijacking."
                )
            )
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Block domain in local network or browser ad-block filter",
                    rationale=f"Preventing DNS resolution to '{domain}' shields devices on your local network."
                )
            )
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Report suspicious link to provider hosting abuse team",
                    rationale="Prompt abuse reports lead to domain suspension and registrar takedowns."
                )
            )
        else:
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Verify domain ownership through official search engine or brand index",
                    rationale="Legitimate organizations rarely use high-risk disposable TLDs for user communications."
                )
            )

        return recs


url_analyzer = SafeUrlAnalyzer()
