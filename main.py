"""ScamShield AI Cloud & Production Entrypoint.

Enables seamless deployment on Render, Railway, Fly.io, Heroku, or Docker
both from repository root and from the backend folder.
"""

import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app and its packages import cleanly
backend_dir = Path(__file__).resolve().parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa: E402, F401

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
