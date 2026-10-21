"""Pytest fixtures for ScamShield AI backend test suite."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Session-scoped test client fixture."""
    with TestClient(app) as test_client:
        yield test_client
