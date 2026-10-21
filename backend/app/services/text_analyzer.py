"""Text threat analysis engine for ScamShield AI.

Analyzes text for phishing, financial scams, impersonation, coercion, extortion,
and violent threats. Strictly separates Risk Severity from Model Confidence,
and generates explainable evidence with protective recommendations.
"""

import re
from typing import List, Tuple
from app.models.schemas import ProtectionRecommendation, TextAnalysisRequest, TextAnalysisResult
from app.models.threat_types import EvidenceItem, IndicatorType, RiskSeverity, ThreatCategory
from app.utils.sanitizers import extract_urls_from_text, mask_sensitive_snippet, sanitize_input_text

# Threat Pattern Definitions: (Regex, Category, Severity, IndicatorType, Description, Weight)
THREAT_RULES = [
    # Violent & Physical Threats (CRITICAL)
    (
        re.compile(r"(?i)\b(kill|murder|slit\s+your|end\s+your\s+life|shoot|hunt\s+you\s+down)\b"),
        ThreatCategory.VIOLENT_THREAT,
        RiskSeverity.CRITICAL,
        IndicatorType.THREAT_LANGUAGE,
        "Direct language indicating physical violence or death threat.",
        0.95
    ),
    (
        re.compile(r"(?i)\b(kidnap|hostage|abduct|have\s+your\s+(child|daughter|son|family))\b"),
        ThreatCategory.VIOLENT_THREAT,
        RiskSeverity.CRITICAL,
        IndicatorType.THREAT_LANGUAGE,
        "Language indicating kidnapping, abduction, or hostage extortion.",
        0.95
    ),
    (
        re.compile(r"(?i)\b(sexual\s+assault|rape|violate\s+you)\b"),
        ThreatCategory.VIOLENT_THREAT,
        RiskSeverity.CRITICAL,
        IndicatorType.THREAT_LANGUAGE,
        "Language expressing sexual violence or severe bodily coercion.",
        0.95
    ),

    # Coercion & Sextortion (CRITICAL / HIGH)
    (
        re.compile(r"(?i)\b(recorded\s+you|webcam|dirty\s+videos?|masturbat|send\s+to\s+all\s+your\s+contacts?|leak\s+your\s+photos?)\b"),
        ThreatCategory.COERCION_EXTORTION,
        RiskSeverity.CRITICAL,
        IndicatorType.PRESSURE_TACTIC,
        "Sextortion or blackmail tactic claiming unauthorized surveillance footage.",
        0.90
    ),
    (
        re.compile(r"(?i)\b(pay\s+me|bitcoin|btc\s+address|send\s+\$?\d+[\d,]*\s*(usd|crypto|btc)|pay\s+in\s+crypto)\b"),
        ThreatCategory.COERCION_EXTORTION,
        RiskSeverity.HIGH,
        IndicatorType.FINANCIAL_TRIGGER,
        "Demand for non-reversible cryptocurrency or payment to avert threats.",
        0.80
    ),

    # Phishing & Credential Harvesting (HIGH)
    (
        re.compile(r"(?i)\b(verify\s+your\s+account|confirm\s+your\s+password|security\s+alert|unauthorized\s+login\s+detected|suspend(?:ed)?\s+(?:your\s+)?account)\b"),
        ThreatCategory.PHISHING,
        RiskSeverity.HIGH,
        IndicatorType.KEYWORD_PATTERN,
        "Classic phishing lure prompting urgent account authentication or credential input.",
        0.85
    ),
    (
        re.compile(r"(?i)\b(one[- ]time\s+(?:passcode|pin|code)|2fa|otp|temporary\s+pin)\b.*?\b(share|send|provide|reply\s+with)\b"),
        ThreatCategory.CREDENTIAL_HARVESTING,
        RiskSeverity.HIGH,
        IndicatorType.KEYWORD_PATTERN,
        "Attempt to harvest two-factor authentication or one-time verification passcode.",
        0.90
    ),
    (
        re.compile(r"(?i)\b(click\s+here\s+to\s+unlock|login\s+to\s+restore|update\s+your\s+billing\s+details?)\b"),
        ThreatCategory.PHISHING,
        RiskSeverity.HIGH,
        IndicatorType.KEYWORD_PATTERN,
        "Deceptive call to action directing user to external account update portal.",
        0.80
    ),

    # Impersonation & Authority Claims (HIGH / MEDIUM)
    (
        re.compile(r"(?i)\b(internal\s+revenue\s+service|irs|fbi|federal\s+bureau|social\s+security\s+administration|law\s+enforcement|warrant\s+for\s+your\s+arrest)\b"),
        ThreatCategory.IMPERSONATION,
        RiskSeverity.HIGH,
        IndicatorType.AUTHORITY_CLAIM,
        "Impersonation of federal or government law enforcement agency.",
        0.85
    ),
    (
        re.compile(r"(?i)\b(geek\s+squad|norton|mcafee|microsoft\s+support|apple\s+support|paypal\s+fraud\s+prevention)\b"),
        ThreatCategory.IMPERSONATION,
        RiskSeverity.MEDIUM,
        IndicatorType.AUTHORITY_CLAIM,
        "Impersonation of corporate tech support, billing, or security department.",
        0.75
    ),

    # Financial Fraud & Scams (HIGH / MEDIUM)
    (
        re.compile(r"(?i)\b(guaranteed\s+returns?|double\s+your\s+bitcoin|crypto\s+investment\s+opportunity|forex\s+trading\s+bot|earn\s+\$?\d+[\d,]*\s*daily)\b"),
        ThreatCategory.FINANCIAL_FRAUD,
        RiskSeverity.HIGH,
        IndicatorType.FINANCIAL_TRIGGER,
        "Unrealistic high-yield financial or cryptocurrency investment offer.",
        0.85
    ),
    (
        re.compile(r"(?i)\b(you\s+have\s+won|lottery\s+winner|unclaimed\s+funds?|inheritance|selected\s+to\s+receive\s+\$?\d+[\d,]*)\b"),
        ThreatCategory.FINANCIAL_FRAUD,
        RiskSeverity.MEDIUM,
        IndicatorType.FINANCIAL_TRIGGER,
        "Advance-fee lottery, grant, or inheritance windfall premise.",
        0.80
    ),
    (
        re.compile(r"(?i)\b(buy\s+(?:[a-z]+\s+)?gift\s+cards?|(?:target|apple|steam|amazon|google\s+play)\s+gift\s+cards?|scratch\s+(?:off\s+)?the\s+back)\b"),
        ThreatCategory.FINANCIAL_FRAUD,
        RiskSeverity.HIGH,
        IndicatorType.FINANCIAL_TRIGGER,
        "Request to purchase and transmit gift card numbers as currency.",
        0.90
    ),

    # Suspicious Urgency & Pressure (MEDIUM / LOW)
    (
        re.compile(r"(?i)\b(within\s+(?:24|12|2|1)\s*hours?|immediately|action\s+required\s+urgently|before\s+it\s+is\s+too\s+late|final\s+notice)\b"),
        ThreatCategory.SUSPICIOUS_URGENCY,
        RiskSeverity.MEDIUM,
        IndicatorType.PRESSURE_TACTIC,
        "Artificial urgency designed to inhibit deliberate critical thinking.",
        0.65
    ),
]


class TextThreatAnalyzer:
    """Core analysis engine for inspecting text messages, emails, and chat solicitations."""

    def analyze(self, request: TextAnalysisRequest) -> TextAnalysisResult:
        clean_text = sanitize_input_text(request.content)
        extracted_urls = extract_urls_from_text(clean_text)

        evidence_list: List[EvidenceItem] = []
        category_weights = {}
        highest_severity = RiskSeverity.INFORMATIONAL

        severity_rank = {
            RiskSeverity.INFORMATIONAL: 0,
            RiskSeverity.LOW: 1,
            RiskSeverity.MEDIUM: 2,
            RiskSeverity.HIGH: 3,
            RiskSeverity.CRITICAL: 4,
        }

        # Scan threat rules
        for regex, category, rule_sev, ind_type, desc, weight in THREAT_RULES:
            match = regex.search(clean_text)
            if match:
                matched_snippet = mask_sensitive_snippet(match.group(0))
                evidence_list.append(
                    EvidenceItem(
                        indicator_type=ind_type,
                        title=f"{category.value.replace('_', ' ').title()} Indicator",
                        description=desc,
                        matched_pattern=matched_snippet,
                        severity_contribution=rule_sev
                    )
                )

                # Track weights for category score
                category_weights[category] = max(category_weights.get(category, 0.0), weight)

                # Update highest severity
                if severity_rank[rule_sev] > severity_rank[highest_severity]:
                    highest_severity = rule_sev

        # If URLs are present inside text, flag malicious link indicator
        if extracted_urls:
            evidence_list.append(
                EvidenceItem(
                    indicator_type=IndicatorType.LOOKALIKE_DOMAIN,
                    title="Embedded Web Link Detected",
                    description=f"Message contains {len(extracted_urls)} external link(s). Always inspect URLs passively before interacting.",
                    matched_pattern=f"{len(extracted_urls)} link(s) found",
                    severity_contribution=RiskSeverity.MEDIUM if category_weights else RiskSeverity.LOW
                )
            )

        # Context evaluation: Platform + Sender checks
        if request.sender_hint:
            sender = request.sender_hint.lower()
            if any(fake in sender for fake in ["support", "security", "alert", "admin", "service", "verify"]):
                if not any(trusted in sender for trusted in ["@microsoft.com", "@google.com", "@apple.com", "@amazon.com"]):
                    evidence_list.append(
                        EvidenceItem(
                            indicator_type=IndicatorType.AUTHORITY_CLAIM,
                            title="Suspicious Sender Handle",
                            description="Sender username or email claims administrative or security status without verifiable domain authenticity.",
                            matched_pattern=mask_sensitive_snippet(request.sender_hint),
                            severity_contribution=RiskSeverity.MEDIUM
                        )
                    )
                    category_weights[ThreatCategory.IMPERSONATION] = max(
                        category_weights.get(ThreatCategory.IMPERSONATION, 0.0), 0.70
                    )

        # Determine Primary Category & Confidence
        if category_weights:
            primary_cat = max(category_weights.items(), key=lambda kv: kv[1])[0]
            confidence = min(0.98, max(0.60, category_weights[primary_cat] + (len(evidence_list) * 0.03)))
            is_threat = True
            secondary_cats = [c for c in category_weights.keys() if c != primary_cat]
        else:
            primary_cat = ThreatCategory.BENIGN
            confidence = 0.85
            is_threat = False
            highest_severity = RiskSeverity.INFORMATIONAL
            secondary_cats = []

        # Construct Plain-Language Summary
        summary = self._build_summary(is_threat, primary_cat, highest_severity, evidence_list)

        # Build Actionable Recommendations
        recommendations = self._build_recommendations(is_threat, primary_cat, highest_severity, extracted_urls)

        return TextAnalysisResult(
            is_threat=is_threat,
            primary_category=primary_cat,
            secondary_categories=secondary_cats,
            severity=highest_severity,
            confidence=round(confidence, 2),
            summary=summary,
            evidence=evidence_list,
            recommendations=recommendations,
            extracted_urls=extracted_urls,
        )

    def _build_summary(
        self,
        is_threat: bool,
        primary_category: ThreatCategory,
        severity: RiskSeverity,
        evidence: List[EvidenceItem]
    ) -> str:
        if not is_threat:
            return "No overt indicators of malicious intent or scam patterns were detected in this message. Maintain standard digital hygiene."

        if severity == RiskSeverity.CRITICAL:
            return (
                f"CRITICAL RISK: Analysis identified explicit markers of {primary_category.value.replace('_', ' ').lower()}. "
                f"{len(evidence)} threat indicator(s) were flagged. Do not comply with demands or send money. "
                "Contact trusted local emergency services or law enforcement if in immediate danger."
            )
        elif severity == RiskSeverity.HIGH:
            return (
                f"HIGH RISK: This message strongly matches known {primary_category.value.replace('_', ' ').lower()} attack patterns. "
                "The sender appears to be attempting to extract credentials, money, or sensitive personal data under false pretenses."
            )
        elif severity == RiskSeverity.MEDIUM:
            return (
                f"MODERATE SUSPICION: Several flags associated with {primary_category.value.replace('_', ' ').lower()} were detected, "
                "including artificial urgency and unsolicited solicitation. Treat with extreme caution."
            )
        else:
            return "LOW RISK: Mild anomalies detected. Review sender authenticity before responding."

    def _build_recommendations(
        self,
        is_threat: bool,
        category: ThreatCategory,
        severity: RiskSeverity,
        urls: List[str]
    ) -> List[ProtectionRecommendation]:
        recs: List[ProtectionRecommendation] = []

        if not is_threat:
            recs.append(
                ProtectionRecommendation(
                    priority="ADVISORY",
                    action="Verify unexpected requests out-of-band",
                    rationale="Even benign-appearing messages can precede targeted social engineering."
                )
            )
            return recs

        if severity == RiskSeverity.CRITICAL:
            if category == ThreatCategory.VIOLENT_THREAT:
                recs.append(
                    ProtectionRecommendation(
                        priority="URGENT",
                        action="Notify emergency services immediately",
                        rationale="Explicit threats to life or bodily safety warrant immediate law enforcement intervention."
                    )
                )
                recs.append(
                    ProtectionRecommendation(
                        priority="URGENT",
                        action="Preserve all message evidence and cease communication",
                        rationale="Do not respond or antagonize the sender; retain exact timestamps and sender details."
                    )
                )
            elif category == ThreatCategory.COERCION_EXTORTION:
                recs.append(
                    ProtectionRecommendation(
                        priority="URGENT",
                        action="Do NOT pay the extortion demand or reply",
                        rationale="Paying extortionists rarely deletes materials and reliably marks victims for repeated extortion."
                    )
                )
                recs.append(
                    ProtectionRecommendation(
                        priority="RECOMMENDED",
                        action="Change credentials on compromised accounts and enable hardware/authenticator 2FA",
                        rationale="Extortionists often obtain passwords from old credential dumps to bluff webcam compromise."
                    )
                )

        if category in (ThreatCategory.PHISHING, ThreatCategory.CREDENTIAL_HARVESTING):
            recs.append(
                ProtectionRecommendation(
                    priority="URGENT",
                    action="Do NOT click any provided links or enter passwords",
                    rationale="Spoofed portals mimic login screens to harvest credentials and session tokens."
                )
            )
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Navigate directly to the official provider's official website or app",
                    rationale="If you suspect an issue with your account, verify by opening a clean browser session manually."
                )
            )

        if category == ThreatCategory.FINANCIAL_FRAUD:
            recs.append(
                ProtectionRecommendation(
                    priority="URGENT",
                    action="Never send funds via wire transfer, cryptocurrency, or gift cards",
                    rationale="These payment instruments are irreversible and standard vectors for fraudulent transactions."
                )
            )
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Contact your financial institution immediately if details were shared",
                    rationale="Promptly alerting your bank can enable fraud locks on affected accounts."
                )
            )

        if category == ThreatCategory.IMPERSONATION:
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Contact the purported entity through an independently verified phone number",
                    rationale="Never rely on phone numbers, links, or contact details provided within the suspicious message."
                )
            )

        if urls:
            recs.append(
                ProtectionRecommendation(
                    priority="RECOMMENDED",
                    action="Submit embedded URLs to ScamShield AI Safe URL Inspector",
                    rationale="Inspect the destination domain passively without triggering drive-by code execution."
                )
            )

        # General safety step
        recs.append(
            ProtectionRecommendation(
                priority="ADVISORY",
                action="Block sender and report message via your messaging platform's spam report tool",
                rationale="Helps global filtering networks suppress identical campaigns targeting others."
            )
        )

        return recs


text_analyzer = TextThreatAnalyzer()
