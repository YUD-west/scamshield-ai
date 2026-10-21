"""Tests for Security Hardening middleware, security headers, and rate limiting."""

import pytest
from fastapi.testclient import TestClient
from app.core.security import InMemoryRateLimiter
from fastapi import FastAPI


def test_security_headers_present(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    headers = response.headers
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert "default-src 'self'" in headers.get("Content-Security-Policy", "")
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", "")
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_rate_limiter_headers_and_limit():
    # Create isolated test app with a low rate limit (3 requests per window)
    test_app = FastAPI()
    test_app.add_middleware(InMemoryRateLimiter, max_requests=3, window_seconds=60)

    @test_app.get("/test-route")
    def sample_route():
        return {"ok": True}

    with TestClient(test_app) as custom_client:
        # Request 1: OK
        res1 = custom_client.get("/test-route")
        assert res1.status_code == 200
        assert res1.headers.get("X-RateLimit-Limit") == "3"
        assert res1.headers.get("X-RateLimit-Remaining") == "2"

        # Request 2: OK
        res2 = custom_client.get("/test-route")
        assert res2.status_code == 200
        assert res2.headers.get("X-RateLimit-Remaining") == "1"

        # Request 3: OK
        res3 = custom_client.get("/test-route")
        assert res3.status_code == 200
        assert res3.headers.get("X-RateLimit-Remaining") == "0"

        # Request 4: Rate limit breached (429)
        res4 = custom_client.get("/test-route")
        assert res4.status_code == 429
        data = res4.json()
        assert "Rate limit exceeded" in data["detail"]
        assert "Retry-After" in res4.headers
