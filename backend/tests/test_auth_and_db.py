"""Tests for SQLite database initialization and authentication flows."""

import pytest
from starlette.testclient import TestClient
from app.main import app
from app.db.database import get_db, init_db


@pytest.fixture
def client():
    return TestClient(app)


def test_db_tables_exist():
    init_db()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row["name"] for row in cursor.fetchall()]
        assert "users" in tables
        assert "sessions" in tables
        assert "incidents" in tables


def test_auth_registration_and_login_flow(client: TestClient):
    import uuid
    rand_suffix = str(uuid.uuid4())[:6]
    username = f"user_{rand_suffix}"
    email = f"user_{rand_suffix}@example.com"
    password = "SafePassword123!"

    # 1. Register new account
    reg_res = client.post("/api/v1/auth/register", json={
        "username": username,
        "email": email,
        "password": password
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    token = reg_data["token"]
    assert reg_data["user"]["username"] == username
    assert reg_data["user"]["role"] == "USER"

    # 2. Get profile with Bearer token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["username"] == username

    # 3. Log in with credentials
    login_res = client.post("/api/v1/auth/login", json={
        "username_or_email": email,
        "password": password
    })
    assert login_res.status_code == 200
    new_token = login_res.json()["token"]

    # 4. Log out
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {new_token}"})
    assert logout_res.status_code == 200

    # 5. Verify revoked token is rejected
    revoked_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert revoked_me.status_code == 401
