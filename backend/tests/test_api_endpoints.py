"""Integration tests for FastAPI REST API endpoints."""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["analyzers_ready"] is True
    assert "text_threat_analyzer" in data["active_services"]


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ScamShield AI"
    assert "documentation" in data


def test_analyze_text_valid_payload(client: TestClient):
    payload = {
        "content": "Verify your account immediately. Suspicious login detected at your bank.",
        "sender_hint": "security@alert-notification.org",
        "platform": "SMS"
    }
    response = client.post("/api/v1/analyze/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_threat"] is True
    assert "severity" in data
    assert "confidence" in data
    assert "evidence" in data
    assert len(data["recommendations"]) > 0


def test_analyze_text_empty_rejected(client: TestClient):
    payload = {"content": "   "}
    response = client.post("/api/v1/analyze/text", json=payload)
    assert response.status_code == 422


def test_analyze_url_valid_payload(client: TestClient):
    payload = {"url": "https://paypal-security-update.com/signin"}
    response = client.post("/api/v1/analyze/url", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["domain"] == "paypal-security-update.com"
    assert data["is_threat"] is True
    assert data["severity"] == "HIGH"
    assert len(data["evidence"]) > 0


def test_analyze_url_invalid_format(client: TestClient):
    payload = {"url": ""}
    response = client.post("/api/v1/analyze/url", json=payload)
    assert response.status_code == 422
