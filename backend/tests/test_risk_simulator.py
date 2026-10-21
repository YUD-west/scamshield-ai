"""Tests for the Risk Simulation Engine and endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.models.schemas import SimulationRequest
from app.models.threat_types import ThreatCategory
from app.services.risk_simulator import risk_simulator


def test_phishing_simulation():
    req = SimulationRequest(
        category=ThreatCategory.PHISHING,
        domain_or_url="https://secure-bank-account-update.xyz"
    )
    res = risk_simulator.simulate(req)

    assert res.threat_category == ThreatCategory.PHISHING
    assert len(res.hypothetical_progression) == 4
    assert res.hypothetical_progression[0].stage_number == 1
    assert any("2FA" in s.title or "Credential" in s.title for s in res.hypothetical_progression)
    assert any("password manager" in s.prevention_gate.lower() or "hardware" in s.prevention_gate.lower() for s in res.hypothetical_progression)
    assert len(res.potential_consequences) > 0
    assert len(res.critical_warning_signs) > 0


def test_financial_fraud_simulation():
    req = SimulationRequest(category=ThreatCategory.FINANCIAL_FRAUD)
    res = risk_simulator.simulate(req)

    assert res.threat_category == ThreatCategory.FINANCIAL_FRAUD
    assert any("Advance-Fee" in s.title or "Deposit" in s.title for s in res.hypothetical_progression)
    assert any("blockchain" in s.prevention_gate.lower() or "regulatory" in s.prevention_gate.lower() for s in res.hypothetical_progression)


def test_extortion_simulation():
    req = SimulationRequest(
        category=ThreatCategory.COERCION_EXTORTION,
        observed_text="I recorded your webcam, pay bitcoin"
    )
    res = risk_simulator.simulate(req)

    assert res.threat_category == ThreatCategory.COERCION_EXTORTION
    assert any("Do Not Pay" in s.prevention_gate for s in res.hypothetical_progression)


def test_impersonation_simulation():
    req = SimulationRequest(category=ThreatCategory.IMPERSONATION)
    res = risk_simulator.simulate(req)

    assert res.threat_category == ThreatCategory.IMPERSONATION
    assert any("Independent Callback" in s.prevention_gate or "verification" in s.prevention_gate.lower() for s in res.hypothetical_progression)


def test_violent_threat_simulation():
    req = SimulationRequest(
        category=ThreatCategory.VIOLENT_THREAT,
        observed_text="I will hunt you down"
    )
    res = risk_simulator.simulate(req)

    assert res.threat_category == ThreatCategory.VIOLENT_THREAT
    assert any("Law Enforcement" in s.prevention_gate or "police" in s.prevention_gate.lower() for s in res.hypothetical_progression)


def test_simulate_endpoint(client: TestClient):
    payload = {
        "category": "PHISHING",
        "domain_or_url": "https://paypal-security-update.com"
    }
    response = client.post("/api/v1/simulate/scenario", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["threat_category"] == "PHISHING"
    assert len(data["hypothetical_progression"]) == 4
    assert len(data["recommended_prevention_gates"]) > 0
