"""Tests for Incident Response, Consent-Based Geolocation, and Multimedia boundaries."""

import base64
import hashlib
import pytest
from fastapi.testclient import TestClient
from app.models.schemas import ConsentLocation, IncidentCreateRequest, MultimediaInspectRequest
from app.models.threat_types import RiskSeverity, ThreatCategory
from app.services.boundaries.multimedia_boundary import multimedia_service
from app.services.incident_service import incident_service


def test_incident_record_evidence_hashing():
    raw = "Subject: Urgent Wire Transfer\nFrom: ceo@fake-spoof.com\nPlease wire $45,000 to account #992817 immediately."
    expected_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()

    req = IncidentCreateRequest(
        title="CEO Wire Impersonation",
        category=ThreatCategory.IMPERSONATION,
        severity=RiskSeverity.HIGH,
        description="Received urgent wire request claiming to be CEO during meeting.",
        raw_evidence=raw,
        sender_information="ceo@fake-spoof.com",
        financial_loss_amount=0.0
    )

    record = incident_service.record_incident(req)

    assert record.incident_id is not None
    assert record.evidence_sha256 == expected_hash
    assert record.status == "EVIDENCE_LOCKED"


def test_consent_location_allowed_when_granted():
    loc = ConsentLocation(
        user_consent_granted=True,
        latitude=37.7749,
        longitude=-122.4194,
        accuracy_meters=15.0
    )
    req = IncidentCreateRequest(
        title="Physical Threat Outside",
        category=ThreatCategory.VIOLENT_THREAT,
        severity=RiskSeverity.CRITICAL,
        description="Received threatening messages stating they know my street.",
        raw_evidence="I know where you live.",
        consent_location=loc
    )

    record = incident_service.record_incident(req)
    assert record.consent_location is not None
    assert record.consent_location.user_consent_granted is True
    assert record.consent_location.latitude == 37.7749


def test_consent_location_rejected_when_not_granted():
    loc = ConsentLocation(
        user_consent_granted=False,
        latitude=37.7749,
        longitude=-122.4194
    )
    req = IncidentCreateRequest(
        title="Unconsented Location",
        category=ThreatCategory.PHISHING,
        severity=RiskSeverity.MEDIUM,
        description="Test without consent.",
        raw_evidence="Phish link",
        consent_location=loc
    )

    with pytest.raises(ValueError, match="explicit user consent"):
        incident_service.record_incident(req)


def test_incident_report_export_safeguards():
    req = IncidentCreateRequest(
        title="Phishing Report Export Test",
        category=ThreatCategory.PHISHING,
        severity=RiskSeverity.HIGH,
        description="Phishing portal targeting company SSO credentials.",
        raw_evidence="https://login.company.com.spoofed-portal.net"
    )
    record = incident_service.record_incident(req)
    export_bundle = incident_service.export_report(record.incident_id)

    assert export_bundle.incident_id == record.incident_id
    assert "OFFICIAL INCIDENT REPORT" in export_bundle.markdown_report
    assert record.evidence_sha256 in export_bundle.markdown_report
    assert export_bundle.transmission_status == "HELD_FOR_USER_REVIEW_AND_MANUAL_FILING"
    assert export_bundle.json_bundle["safeguards"]["automatic_submission_enabled"] is False


def test_multimedia_dangerous_extension_rejection():
    # Attempting to disguise an executable as an image
    meta = multimedia_service.inspect_media_metadata(
        filename="scam-evidence.png.exe",
        content_bytes=b"MZ\x90\x00\x03\x00\x00\x00",
        mime_type="application/x-msdownload"
    )
    assert meta["is_suspicious_extension"] is True


def test_multimedia_audio_boundary_status():
    _, status_note = multimedia_service.process_audio_voicemail(
        filename="robocall_voicemail.mp3",
        content_bytes=b"ID3\x03\x00\x00\x00\x00\x00#TSSE",
        mime_type="audio/mpeg"
    )
    assert "FUTURE_INTEGRATION_BOUNDARY" in status_note


def test_api_incident_endpoints_flow(client: TestClient):
    # 1. Record incident
    create_payload = {
        "title": "API Test Fraud Incident",
        "category": "FINANCIAL_FRAUD",
        "severity": "HIGH",
        "description": "Scammer requested iTunes gift cards for software license renewal.",
        "raw_evidence": "Please send 3x $100 Apple gift cards to renew your Windows license.",
        "sender_information": "tech-support@billing-renewal-help.com",
        "financial_loss_amount": 300.0
    }
    create_res = client.post("/api/v1/incident/record", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    incident_id = created_data["incident_id"]
    assert "evidence_sha256" in created_data

    # 2. Vault list contains the recorded incident
    vault_res = client.get("/api/v1/incident/vault")
    assert vault_res.status_code == 200
    vault_list = vault_res.json()
    assert any(inc["incident_id"] == incident_id for inc in vault_list)

    # 3. Export report returns Markdown & JSON docket
    export_res = client.get(f"/api/v1/incident/{incident_id}/export")
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["incident_id"] == incident_id
    assert "SS-INC-" in export_data["docket_number"]


def test_api_multimedia_inspect_endpoint(client: TestClient):
    sample_text = "Urgent: Verify your account at https://phish-test.xyz"
    encoded_bytes = base64.b64encode(sample_text.encode("utf-8")).decode("ascii")

    payload = {
        "filename": "screenshot_message.png",
        "content_base64": encoded_bytes,
        "mime_type": "image/png"
    }
    res = client.post("/api/v1/media/inspect", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["filename"] == "screenshot_message.png"
    assert data["sha256_checksum"] is not None
    assert "IMPLEMENTED_LOCAL_HEURISTIC" in data["integration_status"]
