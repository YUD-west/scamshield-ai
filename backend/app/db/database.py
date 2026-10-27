"""ScamShield AI Embedded Database Engine (SQLite).

Zero-setup, high-reliability embedded database with automatic schema initialization
and seamless JSON migration for non-technical operation.
"""

import json
import sqlite3
from pathlib import Path
from contextlib import contextmanager
from typing import Generator

DB_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "scamshield.db"
LEGACY_JSON_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "incidents.json"


def init_db(db_file: Path = DB_PATH) -> None:
    """Initialize database tables and import legacy records if needed."""
    db_file.parent.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(db_file) as conn:
        conn.execute("PRAGMA foreign_keys = ON;")
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                role TEXT DEFAULT 'USER',
                created_at TEXT NOT NULL
            );
        """)

        # Active Auth Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            );
        """)

        # Incidents & Sealed Evidence table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                severity TEXT NOT NULL,
                description TEXT NOT NULL,
                raw_evidence TEXT NOT NULL,
                evidence_sha256 TEXT NOT NULL,
                sender_information TEXT,
                financial_loss_amount REAL,
                status TEXT DEFAULT 'EVIDENCE_LOCKED',
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
            );
        """)

        conn.commit()

    # Automatically migrate legacy incidents.json into SQLite if present
    _migrate_legacy_json(db_file)


def _migrate_legacy_json(db_file: Path) -> None:
    if not LEGACY_JSON_PATH.exists():
        return

    try:
        with open(LEGACY_JSON_PATH, "r", encoding="utf-8") as f:
            legacy_data = json.load(f)

        if not isinstance(legacy_data, list) or len(legacy_data) == 0:
            return

        with sqlite3.connect(db_file) as conn:
            cursor = conn.cursor()
            for inc in legacy_data:
                inc_id = inc.get("incident_id") or inc.get("id")
                if not inc_id:
                    continue
                # Check if already migrated
                cursor.execute("SELECT id FROM incidents WHERE id = ?", (inc_id,))
                if cursor.fetchone():
                    continue

                category_val = inc.get("category")
                if isinstance(category_val, dict):
                    category_val = category_val.get("value", "PHISHING")

                severity_val = inc.get("severity")
                if isinstance(severity_val, dict):
                    severity_val = severity_val.get("value", "HIGH")

                cursor.execute("""
                    INSERT INTO incidents (
                        id, user_id, title, category, severity, description,
                        raw_evidence, evidence_sha256, sender_information,
                        financial_loss_amount, status, created_at
                    ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    inc_id,
                    inc.get("title", "Sealed Incident"),
                    str(category_val),
                    str(severity_val),
                    inc.get("description", ""),
                    inc.get("raw_evidence", ""),
                    inc.get("evidence_sha256", ""),
                    inc.get("sender_information"),
                    inc.get("financial_loss_amount"),
                    inc.get("status", "EVIDENCE_LOCKED"),
                    inc.get("created_at", "")
                ))
            conn.commit()
    except Exception:
        pass


@contextmanager
def get_db(db_file: Path = DB_PATH) -> Generator[sqlite3.Connection, None, None]:
    """Context manager for SQLite connections with row dict factory and foreign keys."""
    conn = sqlite3.connect(db_file)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()
