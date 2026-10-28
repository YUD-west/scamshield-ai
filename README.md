# ScamShield AI

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel-black?logo=vercel)](https://scamshield-ai-je1u.vercel.app/)
[![Render API](https://img.shields.io/badge/API-Render-46E3B7?logo=render&logoColor=white)](https://scamshield-ai-1-4s92.onrender.com/api/v1/docs)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-49%20Passing-success?logo=pytest&logoColor=white)](https://github.com/YUD-west/scamshield-ai)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ScamShield AI** is an open-source, non-executing cyber threat triage and scam analysis platform. It inspects suspicious messages, phishing emails, SMS lures (smishing), and dangerous URLs in a strictly isolated environment without following redirects, running remote scripts, or exposing user data.

---

## Live Deployments

- **Web Application:** [https://scamshield-ai-je1u.vercel.app](https://scamshield-ai-je1u.vercel.app/)
- **Backend API Server:** [https://scamshield-ai-1-4s92.onrender.com](https://scamshield-ai-1-4s92.onrender.com)
- **Interactive OpenAPI Documentation:** [https://scamshield-ai-1-4s92.onrender.com/api/v1/docs](https://scamshield-ai-1-4s92.onrender.com/api/v1/docs)
- **API Health Check:** [https://scamshield-ai-1-4s92.onrender.com/api/v1/health](https://scamshield-ai-1-4s92.onrender.com/api/v1/health)

---

## The Problem

Phishing and social engineering attacks increasingly leverage subtle deception techniques:
- **Internationalized Domain Name (IDN) homoglyphs** (substituting Cyrillic or Greek characters into brand domains, e.g., `pаypal.com` where `а` is Unicode `U+0430`).
- **Punycode masquerading** (`xn--...` domains).
- **Multi-stage social engineering lures** designed to panic recipients into entering one-time passwords (OTPs) or transferring funds.

Most traditional scanners require navigating to the untrusted destination or rely entirely on opaque third-party APIs that ingest sensitive user information. ScamShield AI addresses this by providing static, client-safe threat triage, decoupled risk modeling, and cryptographic evidence preservation.

---

## Key Capabilities

### 1. Static Text & Message Triage
- Heuristic classification across major fraud categories: **Credential Phishing**, **Government / Corporate Impersonation**, **Advance-Fee & Crypto Scams**, **Webcam Sextortion**, and **Violent Threats / Extortion**.
- Extracts embedded URLs, phone numbers, and financial handles for contextual evaluation.
- Yields granular evidence indicators with human-readable rationale.

### 2. Non-Executing Safe URL Inspection
- Statically parses URI components without network requests, redirects, or sandbox escape risk.
- Normalizes and detects Unicode homoglyphic lookalikes against high-value target brands (PayPal, Apple, Google, Microsoft, Amazon, Netflix, Banking institutions).
- Flags raw IP hosts, suspicious high-risk top-level domains (`.xyz`, `.top`, `.buzz`, `.club`, etc.), and Shannon entropy anomalies.

### 3. Decoupled Risk Scoring
- Strictly decouples **Harm Severity** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`) from **Model Confidence** (`0% - 100%`). High potential impact (e.g. violent extortion) is never obscured by low statistical certainty.

### 4. Attack Kill-Chain Simulator
- Models multi-stage attack progressions from lure delivery to credential capture, 2FA circumvention, and account compromise.
- Identifies critical warning signs and establishes actionable **Defense Prevention Gates** (e.g., FIDO2 hardware passkeys, out-of-band verification).

### 5. Cryptographic Evidence Locker
- Automatically computes cryptographic **SHA-256 digests** over raw evidence upon capture to ensure integrity.
- Optional browser-consent geolocation context (coordinates are only captured upon explicit user confirmation—never deduced from IP or URL).
- Compiles standardized dispute packages in Markdown and JSON for submission to the **FTC**, **FBI IC3**, local law enforcement, or financial institutions.

### 6. Embedded Database & Authentication
- Zero-configuration embedded SQLite database (`users`, `sessions`, `incidents` tables).
- Password security via PBKDF2-HMAC-SHA256 (100,000 iterations) with cryptographic salting.
- Token-based session management for authenticated users with seamless guest mode support.

### 7. Progressive Web App (PWA)
- Installable on desktop and mobile with home screen support.
- Custom service worker (`sw.js`) provides offline caching and network-first API fallbacks.

### 8. Security & Privacy Controls
- In-memory regex scrubbing strips credit card numbers, SSNs, crypto addresses, and credentials prior to log emission.
- In-memory sliding-window rate limiting (60 requests/minute per client).
- Comprehensive HTTP defensive headers (`CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`).

---

## Architecture & Project Structure

```
scamshield-ai/
├── main.py                          # Cloud & root entrypoint (Render / Docker)
├── render.yaml                      # Render Blueprint configuration
├── requirements.txt                 # Root Python dependencies
├── start.bat                        # Portable Windows one-click local launcher
├── backend/
│   ├── app/
│   │   ├── api/v1/                  # Versioned API routes & endpoints
│   │   │   ├── endpoints/           # analyze, auth, incident, simulate, multimedia, health
│   │   │   └── router.py            # Main API router
│   │   ├── core/                    # App settings, PII-safe logger, security middleware
│   │   ├── db/                      # Embedded SQLite engine and schema initializer
│   │   ├── models/                  # Pydantic v2 schemas and threat taxonomy enums
│   │   ├── services/                # Text analyzer, safe URL inspector, risk simulator, incident vault
│   │   │   └── boundaries/          # Threat intel, reporting agency, and multimedia boundaries
│   │   ├── utils/                   # Homoglyph tables, sanitizers, Shannon entropy calculator
│   │   └── main.py                  # FastAPI application factory
│   ├── data/                        # Local SQLite database (git-ignored)
│   ├── tests/                       # 49 automated pytest test cases
│   ├── requirements.txt             # Backend dependencies
│   └── pytest.ini                   # Pytest configuration
├── frontend/
│   ├── public/                      # PWA icons, manifest, service worker (sw.js)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Header, AuthModal, SeverityBadge, ConfidenceMeter
│   │   │   ├── triage/              # TriageScanner, RiskScorecard, EvidenceList, RecommendationsCard
│   │   │   ├── simulation/          # RiskSimulatorView (attack kill-chain visualizer)
│   │   │   └── incident/            # IncidentVaultView (evidence locker & dispute export)
│   │   ├── services/api.ts          # Typed API client with token storage
│   │   ├── types/                   # TypeScript interfaces matching backend models
│   │   └── utils/scamShieldEngine.ts # Client-side helper utilities
│   ├── vercel.json                  # Vercel SPA rewrite rules
│   ├── vite.config.ts               # Vite bundler & local reverse proxy
│   └── package.json
└── docs/
    └── threat-model.md              # Formal STRIDE threat model & security controls
```

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Engine** | Python 3.11+, FastAPI, Pydantic v2, Uvicorn |
| **Database & Auth** | SQLite 3, PBKDF2-HMAC-SHA256, Secrets token management |
| **Frontend UI** | TypeScript, React 18, Vite, Tailwind CSS, Lucide Icons |
| **Offline / PWA** | Web App Manifest, Service Worker (Cache-First + Stale-While-Revalidate) |
| **Testing** | Pytest, Pytest-Asyncio, HTTPX TestClient |
| **Deployments** | Render (Backend Web Service), Vercel (Frontend Static / SPA) |

---

## Getting Started Locally

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** and **npm**

---

### Option A: One-Click Startup (Windows)
Double-click `start.bat` or run it from a terminal. It automatically checks active ports, launches both the backend and frontend servers, and opens the application in your default browser.

```cmd
start.bat
```

---

### Option B: Manual Setup

#### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the test suite (49 tests)
pytest -v

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://127.0.0.1:8000`.
- API Documentation: `http://127.0.0.1:8000/api/v1/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/v1/health`

#### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install npm packages
npm install

# Build production bundle
npm run build

# Start Vite dev server
npm run dev
```

The frontend will be available at `http://127.0.0.1:5173`. The Vite development server automatically proxies API requests to `http://127.0.0.1:8000`.

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PROJECT_NAME` | string | `ScamShield AI` | Service name in logs and OpenAPI docs |
| `VERSION` | string | `1.0.0` | API version string |
| `ENVIRONMENT` | string | `production` | Environment name (`development` or `production`) |
| `DEBUG` | boolean | `false` | Enable verbose debugging (disabled in production) |
| `BACKEND_CORS_ORIGINS` | list | `["http://localhost:5173", ...]` | Allowed frontend origin URLs |
| `REDACT_PII_IN_LOGS` | boolean | `true` | Scrub credit cards, SSNs, and credentials from logs |
| `RATE_LIMIT_PER_MINUTE` | integer | `60` | Maximum requests per minute per IP address |
| `GOOGLE_SAFE_BROWSING_API_KEY` | string | *(optional)* | Google Safe Browsing API v4 key |
| `VIRUSTOTAL_API_KEY` | string | *(optional)* | VirusTotal v3 API key |
| `ENABLE_EXTERNAL_INTEL` | boolean | `true` | Query external threat feeds when keys are provided |

### Frontend Configuration (`frontend/.env`)

| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API. Leave empty for local development (uses Vite proxy). Set to your Render backend URL in production (e.g., `https://scamshield-ai-1-4s92.onrender.com`). |

---

## Verification & Testing

The backend includes a comprehensive automated test suite consisting of **49 test cases**:

```bash
cd backend
pytest -v
```

### Test Coverage Areas
- **Text Threat Analysis:** Detection of phishing, OTP harvesting, advance-fee scams, webcam extortion, physical harm threats, and clean benign messages.
- **Safe URL Inspection:** Punycode decoding, Cyrillic/Greek homoglyph normalization, direct IP addresses, suspicious TLDs, and entropy calculation.
- **Attack Kill-Chain Simulation:** Progression stage validation, warning sign generation, and prevention gate assertions.
- **Incident Preservation & Hashing:** SHA-256 evidence integrity checks, consent-based geolocation enforcement, and export dockets.
- **Security Hardening:** HTTP security headers (`CSP`, `HSTS`, `X-Frame-Options`), in-memory sliding-window rate limiting (`HTTP 429`), and PII log redaction.
- **Authentication & Database:** SQLite schema initialization, user registration, PBKDF2 hash verification, and session token lifecycle.

---

## Deployment Architecture

### Backend (Render)
- **Repository Root:** Python 3 Web Service via `render.yaml`.
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variable:** `VITE_API_URL=https://scamshield-ai-1-4s92.onrender.com`
- **Routing:** Handled via `frontend/vercel.json` SPA rewrite rules.

---

## Security & STRIDE Threat Model

For the complete architectural threat model, STRIDE evaluation matrix, and defensive control specifications, refer to [docs/threat-model.md](docs/threat-model.md).

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
