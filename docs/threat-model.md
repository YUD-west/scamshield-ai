# ScamShield AI — Threat Model & Security Architecture

This document defines the formal threat model, asset taxonomy, trust boundaries, and defensive controls governing **ScamShield AI**.

---

## 1. System Objectives & Safety Principles

1. **Non-Executing Analysis**: The system analyzes untrusted inputs (messages, URLs, files) purely through static lexical, cryptographic, and structural inspection. No remote connections, redirects, or scripts are executed during analysis.
2. **Decoupled Risk Severity and Confidence**: Analytical confidence ($0\% - 100\%$) is strictly decoupled from impact severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`).
3. **Data Minimization & Log Scrubbing**: Sensitive personal identifiers (passwords, credit cards, SSNs, crypto addresses) are redacted in memory before any log output.
4. **Consent-Based Location Context**: Physical coordinates are only recorded upon explicit browser-level user approval inside incident reports; location is **never** deduced from IP addresses, messages, or URLs.
5. **Human-in-the-Loop Reporting Safeguard**: Dispute reports are never automatically transmitted to authorities or external platforms without verified integration credentials and explicit user sign-off.

---

## 2. Trust Boundaries & Data Flow

```
[ UNTRUSTED INPUT ] 
  (Text / URLs / Base64 Media)
         │
         ▼
[ BOUNDARY 1: Input Validation & Sanitization ]
  - Length bounding (max 10k chars text, 20k evidence)
  - Null byte & control character stripping
  - Safe URI parsing via urllib.parse (no network calls)
         │
         ▼
[ BOUNDARY 2: Privacy-Preserving Logger ]
  - PII regex scrubbers (Cards, SSNs, Keys, Crypto)
  - Redacted message emission to stdout
         │
         ▼
[ BOUNDARY 3: Deterministic Analyzers & Heuristics ]
  - Text Threat Engine (Phishing, Impersonation, Extortion, Violence)
  - Safe URL Inspector (Homoglyphs, Punycode, IP hosts, Entropy)
  - Risk Simulator (Descriptive multi-stage kill chains)
         │
         ▼
[ BOUNDARY 4: Evidence Vault & Cryptographic Sealing ]
  - SHA-256 evidence digests computed at capture time
  - Consent-verified GPS coordinates (optional)
  - Standardized Markdown & JSON dispute docket generation
         │
         ▼
[ BOUNDARY 5: External Service Interfaces (Stubs) ]
  - Threat Intelligence Boundary (Google Safe Browsing / VirusTotal)
  - Official Reporting Boundary (FTC / IC3 / Bank Fraud Unit)
```

---

## 3. Threat Analysis & Mitigations (STRIDE Matrix)

| Threat Category | Potential Attack Vector | ScamShield AI Mitigation Control |
|---|---|---|
| **Spoofing** | IDN Homoglyph / Punycode lookalike domains (`xn--pypal-4ve.com`) | `detect_homoglyphs()` normalizes Unicode lookalikes (Cyrillic, Greek) and maps them to Latin brand targets. |
| **Tampering** | Altering preserved evidence after incident capture | Cryptographic SHA-256 digests computed over raw evidence; verified signatures embedded in export packages. |
| **Repudiation** | Denying communication from fraudulent handles | Incident records capture timestamp, raw header data, and explicit audit logs. |
| **Information Disclosure** | Credentials or PII exposed in application logs or stack traces | Custom `SafeFormatter` and `redact_pii()` scrub sensitive fields prior to log output. |
| **Denial of Service** | Flooding threat analysis endpoints with excessive requests | `InMemoryRateLimiter` enforces sliding-window limits (default 60 req/min/IP) returning HTTP 429. |
| **Elevation of Privilege** | Disguised executable files uploaded as screenshots (`invoice.png.exe`) | `MultimediaServiceBoundary` flags deceptive double extensions and rejects executable payloads. |

---

## 4. HTTP Defensive Hardening

The FastAPI backend enforces the following defensive headers on every response:

- `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing.
- `X-Frame-Options: DENY` — Shields against clickjacking and unauthorized embedding.
- `Content-Security-Policy: default-src 'self' ...` — Prevents unauthorized inline script injection and external script loading.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — Mandates encrypted transport.
- `Referrer-Policy: strict-origin-when-cross-origin` — Protects referral leakage.
- `Permissions-Policy: camera=(), microphone=(), payment=()` — Restricts unauthorized hardware access.
