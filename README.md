# 🌐 SocialSphere — Cybersecurity Training Platform

<div align="center">

![SocialSphere Banner](https://img.shields.io/badge/SocialSphere-Cybersecurity%20Training-6366f1?style=for-the-badge&logo=shield)
![Mode](https://img.shields.io/badge/Mode-Training%20%2F%20Secure-f59e0b?style=for-the-badge)
![Vulnerabilities](https://img.shields.io/badge/Vulnerabilities-50-ef4444?style=for-the-badge)
![OWASP](https://img.shields.io/badge/OWASP-Top%2010-00aa55?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A production-quality, intentionally vulnerable social media platform for cybersecurity training.**

Inspired by [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) and [PortSwigger Web Security Academy](https://portswigger.net/web-security)

[🚀 Quick Start](#quick-start) · [📖 Documentation](./docs) · [🔬 Labs](#vulnerability-labs) · [🛡️ Secure Mode](#modes)

</div>

---

## ⚠️ Important Disclaimer

> **SocialSphere is intentionally vulnerable by design.**
> 
> This platform is for **educational purposes only**. All vulnerabilities are documented and exist solely to help security professionals learn attack and defense techniques.
>
> **DO NOT** deploy this in Training Mode on a public network or production environment.
>
> **DO NOT** use real personal information in this platform.

---

## 🎯 What is SocialSphere?

SocialSphere is a **realistic social media application** that looks and behaves like an actual company product. Users should feel like they're using a real social network — not a contrived security lab.

Underneath this polished exterior are **50 documented, exploitable vulnerabilities** covering every major category from OWASP Top 10.

### Dual-Mode Architecture

```
┌─────────────────────────────────────────┐
│            TRAINING_MODE=true           │
│   ⚠️  Intentionally Vulnerable           │
│   • SQL Injection in login/search        │
│   • XSS in posts/comments               │
│   • No rate limiting                    │
│   • Weak JWT (none algorithm)           │
│   • Insecure cookies                    │
│   • IDOR everywhere                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│            TRAINING_MODE=false          │
│   🔒 Secure (Production-like)           │
│   • Parameterized queries               │
│   • HTML sanitization                   │
│   • Rate limiting                       │
│   • Strict JWT verification             │
│   • Secure cookies (HttpOnly, SameSite) │
│   • RBAC ownership checks               │
└─────────────────────────────────────────┘
```

---

## 🚀 Quick Start (Supabase / Neon / PostgreSQL)

### Prerequisites
- Node.js 18+ & npm 9+
- Hosted PostgreSQL database (Supabase or Neon) or local PostgreSQL

### Setup & Launch

1. **Configure Environment:**
   Set `DATABASE_URL` in `.env` with your Supabase or Neon PostgreSQL connection string:
   - **Neon:** `postgresql://[USER]:[PASSWORD]@[EP_ID].neon.tech/[DB]?sslmode=require`
   - **Supabase:** `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

2. **Install Dependencies & Migrate Database:**
   ```bash
   npm run install  # Or: cd backend && npm i; cd ../frontend && npm i
   npm run migrate  # Runs migrations on DATABASE_URL
   npm run seed     # Seeds demo data
   ```

3. **Start Development Servers:**
   - Backend API: `npm run dev-backend` (runs on http://localhost:4000)
   - Frontend Web: `npm run dev-frontend` (runs on http://localhost:3000)

---

## 🌐 Service URLs

| Service | URL | Description |
|---|---|---|
| **SocialSphere** | http://localhost | Main application |
| **API** | http://localhost/api | REST API |
| **API Docs** | http://localhost:4000/api-docs | Swagger UI |
| **MailHog** | http://localhost:8025 | Email (SMTP simulator) |
| **MinIO** | http://localhost:9001 | Object storage console |
| **Grafana** | http://localhost:3001 | Monitoring dashboards |
| **Prometheus** | http://localhost:9090 | Metrics |

---

## 👤 Demo Accounts

| Username | Password | Role |
|---|---|---|
| `alice` | `password123` | User |
| `bob` | `password123` | User |
| `moderator` | `Mod@123!` | Moderator |
| `admin` | `Admin@123!` | Admin |
| `victim` | `victim123` | Target for IDOR labs |

> ⚠️ These credentials only work in **Training Mode** (MD5 hashing, weak policy)

---

## 🔬 Vulnerability Labs

50 vulnerabilities across 10 categories:

### 💉 Injection (6 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V01 | SQL Injection | Easy → Expert | 4 |
| V02 | Blind SQL Injection | Expert | 1 |
| V28 | Command Injection | Expert | 1 |
| V30 | LDAP Injection | Hard | 1 |
| V38 | NoSQL Injection | Hard | 1 |
| V14 | SSTI (Template Injection) | Expert | 1 |

### 🖥️ Cross-Site Scripting (3 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V03 | Stored XSS | Medium | 1 |
| V04 | Reflected XSS | Easy | 1 |
| V05 | DOM XSS | Medium | 1 |

### 🔐 Authentication (8 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V07 | Broken Authentication | Medium | 2 |
| V08 | JWT Vulnerabilities | Medium → Hard | 2 |
| V41 | Weak Password Policy | Easy | 1 |
| V42 | Insecure Password Storage | Medium | 1 |
| V43 | Predictable Tokens | Hard | 1 |
| V23 | Session Fixation | Hard | 1 |
| V24 | Session Hijacking | Hard | 1 |
| V50 | Account Takeover | Hard | 1 |

### 🚪 Access Control (5 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V09 | IDOR | Easy → Medium | 3 |
| V10 | Broken Access Control | Hard | 1 |
| V49 | Privilege Escalation | Hard → Expert | 2 |
| V06 | CSRF | Easy → Medium | 2 |
| V15 | Open Redirect | Easy | 1 |

### 🔎 Server-Side (8 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V11 | Unrestricted File Upload | Hard | 1 |
| V12 | SSRF | Hard → Expert | 2 |
| V13 | XXE | Hard | 1 |
| V27 | Directory Traversal | Medium | 1 |
| V29 | Insecure Deserialization | Expert | 1 |
| V34 | HTTP Request Smuggling | Expert | 1 |
| V33 | Cache Poisoning | Hard | 1 |
| V18 | API Security (BOLA/BFLA) | Hard | 2 |

### 🌐 Client-Side (5 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V16 | Clickjacking | Easy | 1 |
| V17 | CORS Misconfiguration | Medium | 1 |
| V44 | Insecure Cookies | Easy | 1 |
| V45 | Missing Security Headers | Easy | 1 |
| V46 | Missing CSP | Medium | 1 |

### 🎯 Business Logic (5 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V20 | Race Conditions | Hard | 1 |
| V21 | Business Logic Flaws | Easy → Medium | 2 |
| V22 | No Rate Limiting | Medium | 1 |
| V47 | Sensitive Data Exposure | Medium | 1 |
| V48 | Logging Failures | Medium | 1 |

### 🔩 Prototype & Injection (5 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V36 | Prototype Pollution | Medium | 1 |
| V37 | Prototype Pollution (Node.js) | Hard | 1 |
| V25 | OAuth Misconfiguration | Hard | 1 |
| V31 | Email Enumeration | Easy | 1 |
| V32 | Username Enumeration | Easy | 1 |

### 📊 GraphQL (3 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V19a | GraphQL Introspection | Easy | 1 |
| V19b | GraphQL Batch Attack | Hard | 1 |
| V19c | GraphQL DoS | Expert | 1 |

### 🔏 Crypto & Session (5 vulns)
| ID | Vulnerability | Difficulty | Flags |
|---|---|---|---|
| V26 | Information Disclosure | Easy | 1 |
| V35 | HTTP Response Splitting | Medium | 1 |
| V39 | XML Injection | Medium | 1 |
| V40 | JSON Injection | Medium | 1 |
| V19 | GraphQL Deep Query DoS | Expert | 1 |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     SocialSphere Platform                     │
├────────────────┬───────────────┬──────────────┬──────────────┤
│   Next.js 14   │    Express    │  PostgreSQL  │    Redis     │
│   Frontend     │     API       │   Database   │    Cache     │
│     :3000      │    :4000      │    :5432     │    :6379     │
├────────────────┴───────────────┴──────────────┴──────────────┤
│  MinIO :9000   │  MailHog :8025  │  OpenLDAP :389           │
├──────────────────────────────────────────────────────────────┤
│  Prometheus :9090  │  Grafana :3001  │  Wazuh Agent         │
├──────────────────────────────────────────────────────────────┤
│                    Nginx Reverse Proxy :80                    │
└──────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript, TailwindCSS, ShadCN UI, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Object Storage | MinIO (S3-compatible) |
| Authentication | JWT + Refresh Tokens + Google OAuth 2.0 |
| Email | MailHog (development SMTP) |
| Monitoring | Prometheus + Grafana + Wazuh |
| Container | Docker + Docker Compose |
| Proxy | Nginx |

---

## 📁 Project Structure

```
socialmedia/
├── 📄 docker-compose.yml          ← All services (training mode)
├── 📄 docker-compose.secure.yml   ← Secure mode overrides
├── 📄 .env.example                ← Environment template
├── 📄 Makefile                    ← Developer shortcuts
├── 📄 README.md                   ← This file
│
├── 🖥️  frontend/                  ← Next.js 14 Application
│   ├── src/app/                   ← App Router pages
│   │   ├── (auth)/                ← Login, Register, Forgot Password
│   │   ├── (main)/                ← Feed, Profile, Messages, etc.
│   │   ├── admin/                 ← Admin dashboard
│   │   └── lab/                   ← CTF lab interface
│   └── src/components/
│       ├── ui/                    ← ShadCN UI components
│       ├── lab/                   ← Training mode components
│       └── ...
│
├── ⚙️  backend/                   ← Express API
│   └── src/
│       ├── config/                ← DB, Redis, MinIO, env
│       ├── middleware/            ← Auth, RBAC, CSRF, rate limiter
│       ├── routes/                ← All API routes
│       ├── controllers/           ← Business logic (+ vulnerabilities)
│       └── services/              ← Email, Socket.IO, MinIO
│
├── 🗄️  database/
│   ├── migrations/               ← Knex migrations (all tables)
│   └── seeds/                    ← Demo data + CTF flags
│
├── 📊 monitoring/
│   ├── prometheus/               ← Scrape config
│   └── grafana/                  ← Dashboards + provisioning
│
├── 🌐 nginx/                     ← Reverse proxy config
│
└── 📖 docs/
    ├── architecture.md
    ├── threat-model.md
    ├── er-diagram.md
    ├── deployment.md
    ├── developer-guide.md
    ├── api-docs/swagger.yaml
    └── vulnerabilities/          ← Per-vuln writeups (V01-V50)
```

---

## 🛡️ Modes

### Training Mode (`TRAINING_MODE=true`)
Enables all intentional vulnerabilities for hands-on learning:
- SQL queries use string concatenation
- No HTML sanitization (XSS possible)
- Rate limiting disabled (brute force possible)
- CSRF tokens disabled
- JWT accepts "none" algorithm
- Verbose error messages (stack traces)
- Insecure cookies (no HttpOnly, no SameSite)
- MD5 password hashing
- Predictable tokens

### Secure Mode (`TRAINING_MODE=false`)
Implements all security fixes:
- Parameterized queries everywhere
- HTML sanitization with DOMPurify/sanitize-html
- Redis-backed rate limiting per IP
- CSRF double-submit cookies
- JWT algorithm pinning (HS256 only)
- Generic error messages
- HttpOnly, Secure, SameSite=Strict cookies
- Argon2id password hashing
- Cryptographically random tokens

---

## 🔒 Switching Modes

```bash
# Switch to Training Mode
make switch-training
# or: TRAINING_MODE=true docker compose restart backend frontend

# Switch to Secure Mode
make switch-secure
# or: TRAINING_MODE=false docker compose restart backend frontend
```

---

## 📖 Documentation

| Document | Description |
|---|---|
| [Architecture](./docs/architecture.md) | System design, diagrams |
| [Threat Model](./docs/threat-model.md) | STRIDE analysis |
| [ER Diagram](./docs/er-diagram.md) | Database relationships |
| [Developer Guide](./docs/developer-guide.md) | Setup, contributing |
| [Deployment Guide](./docs/deployment.md) | Docker, production |
| [Kubernetes Guide](./docs/kubernetes.md) | K8s manifests, Helm |
| [API Docs](http://localhost:4000/api-docs) | Swagger UI (live) |
| [Security Checklist](./docs/security-checklist.md) | Pre-deployment checks |

---

## 🧪 Testing

```bash
# Run all tests
make test

# Backend unit tests
cd backend && npm test

# Integration tests
cd backend && npm run test:integration

# Vulnerability exploit tests (verify vulns work/are fixed)
cd backend && npm run test:vulns

# E2E tests (Playwright)
cd frontend && npx playwright test

# Security scanning
docker run --rm -v $(pwd):/app owasp/dependency-check ...
```

---

## 🚀 CI/CD

GitHub Actions pipelines in `.github/workflows/`:
- `ci.yml` — Lint, test, build on every PR
- `security.yml` — Trivy container scan, OWASP dependency check
- `deploy.yml` — Deploy to staging on main branch merge

---

## 📋 Social Features

| Feature | Status |
|---|---|
| Registration / Login / OAuth | ✅ |
| Email Verification | ✅ |
| JWT + Refresh Tokens | ✅ |
| Posts (text, images, videos) | ✅ |
| Stories | ✅ |
| Comments & Likes | ✅ |
| Follow / Followers / Following | ✅ |
| Direct Messages | ✅ |
| Group Chat | ✅ |
| Hashtags & Explore | ✅ |
| Notifications | ✅ |
| Bookmarks / Saved Posts | ✅ |
| User Search | ✅ |
| Privacy Settings | ✅ |
| Marketplace | ✅ |
| Communities | ✅ |
| Admin Dashboard | ✅ |
| Moderator Dashboard | ✅ |
| Analytics | ✅ |
| Real-time (Socket.IO) | ✅ |

---

## 🎓 Learning Path

### Beginner
1. Start with V04 (Reflected XSS) — just add `<script>alert(1)</script>` to search
2. Try V01 Easy — login bypass with `' OR '1'='1'--`
3. V09 Easy — IDOR on private posts (just change the ID)

### Intermediate
1. V03 — Stored XSS cookie theft
2. V08 — JWT none algorithm bypass
3. V06 — CSRF attack
4. V12 — SSRF to internal services

### Advanced
1. V02 — Blind SQL injection
2. V14 — SSTI to RCE
3. V28 — Command injection via filename
4. V49 — Privilege escalation to admin

### Expert
1. V34 — HTTP request smuggling
2. V29 — Insecure deserialization
3. V20 — Race condition exploitation

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Ensure new vulnerabilities have full documentation
4. Include unit tests for both vuln and secure versions
5. Submit a pull request

---

## 📜 License

MIT License — See [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/) — Inspiration
- [PortSwigger Web Security Academy](https://portswigger.net/web-security) — Lab format inspiration
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Vulnerability taxonomy
- [MITRE ATT&CK](https://attack.mitre.org/) — Threat framework

---

<div align="center">

**Built with ❤️ for the cybersecurity education community**

⚠️ **For educational use in authorized lab environments only** ⚠️

</div>
