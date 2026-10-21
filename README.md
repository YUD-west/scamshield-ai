# ScamShield AI — Security Operations Agent

**ScamShield AI** is an automated cybersecurity and fraud triage assistant engineered to detect scams, model attack progressions, prevent unsafe interactions, and generate tamper-evident incident response bundles.

---

## Key Features

1. **Text Threat Detection**
   - Heuristic classification for **Phishing**, **Corporate & Government Impersonation**, **Advance-Fee / Crypto Scams**, **Webcam Sextortion & Coercion**, and **Violent Threats** (death, kidnapping, and physical bodily harm).
   - Generates granular, auditable **Evidence Indicators** explaining *why* a message is malicious.

2. **Safe Non-Executing URL Analysis**
   - Statically evaluates suspicious links and domains without navigating to them or executing remote code.
   - Identifies **Internationalized Domain Name (IDN) homoglyphic deception** (Cyrillic lookalikes like `xn--pypal-4ve.com`), direct IP hosts, suspicious disposable TLDs (`.xyz`, `.top`, `.buzz`), and Shannon entropy anomalies.

3. **Decoupled Risk Scoring**
   - Strictly separates **Harm Severity** (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`) from **Model Confidence** (`0% - 100%`).

4. **Safe Risk & Kill-Chain Simulator**
   - Generates realistic multi-stage attack progressions (lure delivery $\to$ credential capture $\to$ 2FA bypass $\to$ account takeover).
   - Identifies observable **Warning Signs** and establishes actionable **Defense Prevention Gates** (e.g. FIDO2 passkeys, out-of-band verification) to halt the attack.

5. **Incident Response & Evidence Vault**
   - Seals digital evidence with cryptographic **SHA-256 digests**.
   - Supports **consent-verified geolocation** (location is never guessed from IP or URL).
   - Compiles standardized dispute filing dockets in Markdown and JSON suitable for submission to the **FTC**, **FBI IC3**, local police, or bank fraud departments.
   - Enforces safeguards against unauthorized automatic transmission to official bodies.

6. **Privacy & Security Hardening**
   - In-memory regex scrubbing strips credit cards, SSNs, phone numbers, email addresses, cryptocurrency wallets, and secrets before log emission.
   - Built-in sliding-window **Rate Limiting** and HTTP defensive security headers (`CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`).

---

## Project Structure

```
scamshield-ai/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/        # Endpoints (analyze, simulate, incident, multimedia, health)
│   │   ├── core/                    # Config, PII-safe logging, Security middleware & rate limiting
│   │   ├── models/                  # Pydantic schemas, RiskSeverity & ThreatCategory enums
│   │   ├── services/                # Text analyzer, Safe URL inspector, Risk simulator, Incident vault
│   │   │   └── boundaries/          # Threat intel, Reporting agency, Multimedia boundaries
│   │   ├── utils/                   # Homoglyph lookalike tables, Sanitizers, Entropy calculator
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/                       # 45 automated pytest test cases (100% passing)
│   ├── requirements.txt
│   └── pytest.ini
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Header, SeverityBadge, ConfidenceMeter
│   │   │   ├── triage/              # TriageScanner, RiskScorecard, EvidenceList, RecommendationsCard
│   │   │   ├── simulation/          # RiskSimulatorView (Attack Kill-Chain modeler)
│   │   │   └── incident/            # IncidentVaultView (Evidence locking & dispute export)
│   │   ├── services/api.ts          # Typed API client
│   │   └── types/                   # TypeScript interfaces mirroring backend models
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── threat-model.md              # Formal STRIDE threat model & security controls
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Python 3.12+**
- **Node.js v20+** and **npm**

---

### 2. Backend Setup & Startup

```bash
cd backend

# Create virtual environment and activate
python -m venv .venv
.\.venv\Scripts\activate   # On Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Run the test suite (45 tests)
pytest

# Launch the FastAPI backend server
uvicorn app.main:app --reload --port 8000
```

- Interactive OpenAPI Swagger Docs: `http://localhost:8000/api/v1/docs`
- Health Endpoint: `http://localhost:8000/api/v1/health`

---

### 3. Frontend Setup & Startup

```bash
cd frontend

# Install dependencies (already completed in workspace)
npm install

# Build production bundle
npm run build

# Start development server
npm run dev
```

- Accessible at: `http://localhost:5173` (proxies API requests to port `8000`).

---

## Test Suite Execution

All 45 automated backend tests can be verified at any time:

```bash
cd backend
.\.venv\Scripts\python -m pytest tests -v
```

Tests cover:
- Text threat detection across all threat categories (violence, extortion, phishing, financial scams, impersonation, benign text)
- Safe URL inspection (Punycode, homoglyphs, IP hosts, suspicious TLDs, entropy, threat intel boundary)
- Risk simulation stage progressions and prevention gates
- Incident recording, cryptographic SHA-256 evidence digests, consent location validation
- Multimedia boundary metadata checks and dangerous extension detection
- Privacy-safe log redaction (credit cards, SSNs, emails, crypto wallets, passwords)
- Security hardening headers and in-memory rate limiting (HTTP 429)
