"""Authentication & Vault Security Service.

Implements PBKDF2 password derivation (100,000 iterations), cryptographic salts,
and tamper-proof session tokens with zero external server dependencies.
"""

import hashlib
import hmac
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from pydantic import BaseModel, EmailStr

from app.db.database import get_db


class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    role: str = "USER"
    created_at: str


class AuthTokenResponse(BaseModel):
    token: str
    expires_at: str
    user: UserResponse


class AuthService:
    """Manages user registration, secure credential verification, and session lifecycle."""

    ITERATIONS = 100_000

    def hash_password(self, password: str) -> Tuple[str, str]:
        """Derives a salted PBKDF2-HMAC-SHA256 hash."""
        salt = secrets.token_bytes(16)
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            self.ITERATIONS
        )
        return derived.hex(), salt.hex()

    def verify_password(self, password: str, hash_hex: str, salt_hex: str) -> bool:
        """Verifies a plaintext password against the stored salt and hash in constant time."""
        try:
            salt = bytes.fromhex(salt_hex)
            expected = bytes.fromhex(hash_hex)
            derived = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                salt,
                self.ITERATIONS
            )
            return hmac.compare_digest(derived, expected)
        except Exception:
            return False

    def register(
        self,
        username: str,
        password: str,
        email: Optional[str] = None
    ) -> AuthTokenResponse:
        """Register a new user account and issue an initial session token."""
        clean_username = username.strip().lower()
        if len(clean_username) < 3:
            raise ValueError("Username must be at least 3 characters long.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        clean_email = email.strip().lower() if email else None

        user_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        pwd_hash, salt = self.hash_password(password)

        with get_db() as conn:
            cursor = conn.cursor()
            # Check unique username
            cursor.execute("SELECT id FROM users WHERE username = ?", (clean_username,))
            if cursor.fetchone():
                raise ValueError("An account with this username already exists.")

            if clean_email:
                cursor.execute("SELECT id FROM users WHERE email = ?", (clean_email,))
                if cursor.fetchone():
                    raise ValueError("An account with this email address already exists.")

            cursor.execute("""
                INSERT INTO users (id, username, email, password_hash, salt, role, created_at)
                VALUES (?, ?, ?, ?, ?, 'USER', ?)
            """, (user_id, clean_username, clean_email, pwd_hash, salt, created_at))
            conn.commit()

        user_obj = UserResponse(
            id=user_id,
            username=clean_username,
            email=clean_email,
            role="USER",
            created_at=created_at
        )
        return self._create_session(user_obj)

    def login(self, username_or_email: str, password: str) -> AuthTokenResponse:
        """Authenticate user credentials and issue a new session token."""
        clean_identifier = username_or_email.strip().lower()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, username, email, password_hash, salt, role, created_at
                FROM users
                WHERE username = ? OR email = ?
            """, (clean_identifier, clean_identifier))
            row = cursor.fetchone()

        if not row:
            raise ValueError("Invalid username or password.")

        if not self.verify_password(password, row["password_hash"], row["salt"]):
            raise ValueError("Invalid username or password.")

        user_obj = UserResponse(
            id=row["id"],
            username=row["username"],
            email=row["email"],
            role=row["role"],
            created_at=row["created_at"]
        )
        return self._create_session(user_obj)

    def get_user_by_token(self, token: str) -> Optional[UserResponse]:
        """Validate an active session token and retrieve associated user."""
        if not token:
            return None

        now_iso = datetime.now(timezone.utc).isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT u.id, u.username, u.email, u.role, u.created_at
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ? AND s.expires_at > ?
            """, (token, now_iso))
            row = cursor.fetchone()

        if not row:
            return None

        return UserResponse(
            id=row["id"],
            username=row["username"],
            email=row["email"],
            role=row["role"],
            created_at=row["created_at"]
        )

    def logout(self, token: str) -> bool:
        """Revoke a session token."""
        if not token:
            return False

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
            return cursor.rowcount > 0

    def _create_session(self, user: UserResponse) -> AuthTokenResponse:
        token = secrets.token_urlsafe(36)
        created_at = datetime.now(timezone.utc)
        expires_at = created_at + timedelta(days=30)

        created_str = created_at.isoformat()
        expires_str = expires_at.isoformat()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO sessions (token, user_id, created_at, expires_at)
                VALUES (?, ?, ?, ?)
            """, (token, user.id, created_str, expires_str))
            conn.commit()

        return AuthTokenResponse(
            token=token,
            expires_at=expires_str,
            user=user
        )


auth_service = AuthService()
