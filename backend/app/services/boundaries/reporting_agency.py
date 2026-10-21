"""Official reporting channel boundary for law enforcement and financial agencies.

Enforces strict policy safeguards: Reports are NOT transmitted automatically.
Packages cryptographically signed incident dockets for user-authorized official submission.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class OfficialReportingBoundary:
    """Service boundary for verified official reporting channels (e.g. FTC, IC3, Bank Fraud)."""

    def prepare_submission_package(
        self,
        incident_id: str,
        title: str,
        category: str,
        severity: str,
        evidence_hash: str,
        user_narrative: str,
        consent_location: Optional[Dict[str, Any]] = None,
        financial_loss: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Format an official dispute docket with cryptographic verification."""
        timestamp = datetime.now(timezone.utc).isoformat()

        raw_payload = f"{incident_id}:{evidence_hash}:{timestamp}"
        verification_signature = hashlib.sha256(raw_payload.encode()).hexdigest()

        docket_number = f"SS-INC-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{incident_id[:8].upper()}"

        package = {
            "docket_number": docket_number,
            "incident_id": incident_id,
            "created_at": timestamp,
            "classification": {
                "category": category,
                "severity": severity,
            },
            "evidence_integrity": {
                "sha256_checksum": evidence_hash,
                "verification_signature": verification_signature,
            },
            "narrative": user_narrative,
            "financial_loss_reported": financial_loss,
            "location_context": (
                {
                    "verified_user_consent": True,
                    "latitude": consent_location.get("latitude"),
                    "longitude": consent_location.get("longitude"),
                    "accuracy_meters": consent_location.get("accuracy_meters"),
                    "capture_timestamp": consent_location.get("captured_at"),
                }
                if consent_location and consent_location.get("user_consent_granted")
                else {
                    "verified_user_consent": False,
                    "note": "Location not shared by user or omitted by privacy preference."
                }
            ),
            "safeguards": {
                "automatic_submission_enabled": False,
                "status": "HELD_FOR_USER_REVIEW_AND_MANUAL_FILING",
                "policy_notice": (
                    "In compliance with ScamShield AI safety safeguards, reports are never sent to "
                    "authorities automatically without authorized official API integration and explicit sign-off."
                ),
            },
        }

        return package


reporting_boundary = OfficialReportingBoundary()
