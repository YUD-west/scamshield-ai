# ScamShield AI

ScamShield AI is a security-focused AI agent designed to detect scams, predict potential harm, prevent unsafe interactions, and support incident response.

## Core Capabilities

- **Text Threat Detection**: Real-time detection of phishing, impersonation, financial fraud, coercion, extortion, and violent threats with explainable evidence.
- **Safe URL Analysis**: Passive, non-executing inspection of URLs and domains. Detects homoglyphic lookalikes, Punycode tricks, direct IP hosts, suspicious TLDs, and calculates Shannon entropy.
- **Decoupled Risk Scoring**: Explicitly separates potential harm severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`) from model confidence (`0.00` to `1.00`).
- **Privacy & Sanitization**: Zero PII leakage in application logs; in-memory scrubbing of credentials, credit cards, SSNs, and crypto addresses.
- **Service Boundaries**: Documented boundaries for threat intelligence feeds and official law enforcement reporting channels.

## Getting Started (Backend)

### Prerequisites
- Python 3.12+

### Setup & Installation
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### Running Tests
```bash
pytest
```

### Starting the API Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation available at `http://localhost:8000/api/v1/docs`.
