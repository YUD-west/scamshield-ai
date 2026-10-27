"""Incident response, evidence preservation, and report generation service."""

import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.db.database import get_db, init_db
from app.models.schemas import (
    ConsentLocation,
    IncidentCreateRequest,
    IncidentRecord,
    OfficialReportExport,
)
from app.models.threat_types import ThreatCategory, RiskSeverity
from app.services.boundaries.reporting_agency import reporting_boundary


class IncidentService:
    """Handles secure evidence capture, cryptographic hashing, and report generation using SQLite database."""

    def __init__(self):
        init_db()

    def record_incident(self, req: IncidentCreateRequest, user_id: Optional[str] = None) -> IncidentRecord:
        incident_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        created_str = timestamp.isoformat()

        # 1. Compute Cryptographic Evidence Checksum (SHA-256)
        evidence_bytes = req.raw_evidence.encode("utf-8")
        evidence_hash = hashlib.sha256(evidence_bytes).hexdigest()

        # 2. Strict Consent-Based Location Verification
        sanitized_location = None
        if req.consent_location:
            if not req.consent_location.user_consent_granted:
                raise ValueError("Location data can only be retained if explicit user consent is granted.")
            sanitized_location = req.consent_location

        # 3. Create Tamper-Evident Incident Record
        record = IncidentRecord(
            incident_id=incident_id,
            title=req.title,
            category=req.category,
            severity=req.severity,
            description=req.description,
            raw_evidence=req.raw_evidence,
            evidence_sha256=evidence_hash,
            sender_information=req.sender_information,
            consent_location=sanitized_location,
            financial_loss_amount=req.financial_loss_amount,
            status="EVIDENCE_LOCKED",
            created_at=timestamp,
        )

        category_val = req.category.value if hasattr(req.category, "value") else str(req.category)
        severity_val = req.severity.value if hasattr(req.severity, "value") else str(req.severity)

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO incidents (
                    id, user_id, title, category, severity, description,
                    raw_evidence, evidence_sha256, sender_information,
                    financial_loss_amount, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EVIDENCE_LOCKED', ?)
            """, (
                incident_id,
                user_id,
                req.title,
                category_val,
                severity_val,
                req.description,
                req.raw_evidence,
                evidence_hash,
                req.sender_information,
                req.financial_loss_amount,
                created_str
            ))
            conn.commit()

        return record

    def get_incident(self, incident_id: str) -> Optional[IncidentRecord]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, title, category, severity, description, raw_evidence,
                       evidence_sha256, sender_information, financial_loss_amount,
                       status, created_at
                FROM incidents
                WHERE id = ?
            """, (incident_id,))
            row = cursor.fetchone()

        if not row:
            return None

        return self._row_to_record(row)

    def list_incidents(self, user_id: Optional[str] = None) -> List[IncidentRecord]:
        with get_db() as conn:
            cursor = conn.cursor()
            if user_id:
                cursor.execute("""
                    SELECT id, title, category, severity, description, raw_evidence,
                           evidence_sha256, sender_information, financial_loss_amount,
                           status, created_at
                    FROM incidents
                    WHERE user_id = ? OR user_id IS NULL
                    ORDER BY created_at DESC
                """, (user_id,))
            else:
                cursor.execute("""
                    SELECT id, title, category, severity, description, raw_evidence,
                           evidence_sha256, sender_information, financial_loss_amount,
                           status, created_at
                    FROM incidents
                    ORDER BY created_at DESC
                """)
            rows = cursor.fetchall()

        return [self._row_to_record(row) for row in rows]

    def delete_incident(self, incident_id: str, user_id: Optional[str] = None) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            if user_id:
                cursor.execute("DELETE FROM incidents WHERE id = ? AND (user_id = ? OR user_id IS NULL)", (incident_id, user_id))
            else:
                cursor.execute("DELETE FROM incidents WHERE id = ?", (incident_id,))
            conn.commit()
            return cursor.rowcount > 0

    def clear_incidents(self, user_id: Optional[str] = None) -> int:
        with get_db() as conn:
            cursor = conn.cursor()
            if user_id:
                cursor.execute("DELETE FROM incidents WHERE user_id = ?", (user_id,))
            else:
                cursor.execute("DELETE FROM incidents")
            conn.commit()
            return cursor.rowcount

    def _row_to_record(self, row) -> IncidentRecord:
        try:
            category_enum = ThreatCategory(row["category"])
        except Exception:
            category_enum = ThreatCategory.PHISHING

        try:
            severity_enum = RiskSeverity(row["severity"])
        except Exception:
            severity_enum = RiskSeverity.HIGH

        try:
            created_dt = datetime.fromisoformat(row["created_at"])
        except Exception:
            created_dt = datetime.now(timezone.utc)

        return IncidentRecord(
            incident_id=row["id"],
            title=row["title"],
            category=category_enum,
            severity=severity_enum,
            description=row["description"],
            raw_evidence=row["raw_evidence"],
            evidence_sha256=row["evidence_sha256"],
            sender_information=row["sender_information"],
            financial_loss_amount=row["financial_loss_amount"],
            status=row["status"] or "EVIDENCE_LOCKED",
            created_at=created_dt
        )

    def export_report(self, incident_id: str) -> OfficialReportExport:
        incident = self.get_incident(incident_id)
        if not incident:
            raise KeyError(f"Incident with ID '{incident_id}' not found.")

        # Prepare JSON packet via reporting boundary
        loc_dict = incident.consent_location.model_dump() if incident.consent_location else None
        json_bundle = reporting_boundary.prepare_submission_package(
            incident_id=incident.incident_id,
            title=incident.title,
            category=incident.category.value,
            severity=incident.severity.value,
            evidence_hash=incident.evidence_sha256,
            user_narrative=incident.description,
            consent_location=loc_dict,
            financial_loss=incident.financial_loss_amount,
        )

        # Generate Standardized Markdown Report
        markdown = self._generate_markdown_report(incident, json_bundle)

        return OfficialReportExport(
            incident_id=incident.incident_id,
            docket_number=json_bundle["docket_number"],
            markdown_report=markdown,
            json_bundle=json_bundle,
            verification_signature=json_bundle["evidence_integrity"]["verification_signature"],
            transmission_status=json_bundle["safeguards"]["status"],
        )

    def _generate_markdown_report(self, inc: IncidentRecord, bundle: dict) -> str:
        loc_str = "None shared (omitted per user privacy preference)"
        if inc.consent_location and inc.consent_location.user_consent_granted:
            loc_str = (
                f"Latitude: {inc.consent_location.latitude:.5f}, "
                f"Longitude: {inc.consent_location.longitude:.5f} "
                f"(±{inc.consent_location.accuracy_meters or 0:.1f}m) [Explicit User Consent Verified]"
            )

        loss_str = f"${inc.financial_loss_amount:,.2f} USD" if inc.financial_loss_amount else "None / Pre-transaction intervention"

        return f"""# OFFICIAL INCIDENT REPORT — SCAMSHIELD DEFENSE
**Docket Number:** {bundle['docket_number']}  
**Generated At:** {bundle['created_at']}  
**Verification Digest (SHA-256):** `{inc.evidence_sha256}`  
**Cryptographic Signature:** `{bundle['evidence_integrity']['verification_signature']}`  

---

## 1. INCIDENT CLASSIFICATION
- **Incident Title:** {inc.title}
- **Primary Category:** {inc.category.value.replace('_', ' ')}
- **Harm Severity Level:** {inc.severity.value}
- **Status:** {inc.status}
- **Financial Loss Reported:** {loss_str}

## 2. PARTIES & CONTEXT
- **Target / Complainant Context:** Verified User Report
- **Purported Sender / Source:** {inc.sender_information or 'Unknown / Masked'}
- **Consent-Verified Location Context:** {loc_str}

## 3. USER STATEMENT & NARRATIVE
{inc.description}

## 4. PRESERVED DIGITAL EVIDENCE
```
{inc.raw_evidence}
```

## 5. EVIDENCE INTEGRITY & POLICY SAFEGUARDS
- Evidence is sealed with SHA-256 digest `{inc.evidence_sha256}`.
- **Reporting Channel Safeguard:** This report has NOT been transmitted to authorities automatically.
- File this official report directly with your bank's fraud unit, the FTC (reportfraud.ftc.gov), or the FBI IC3 (ic3.gov).
"""


incident_service = IncidentService()
