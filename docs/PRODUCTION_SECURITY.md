# RakshaGrid — Production Security Hardening Specification

**Project**: RakshaGrid — Disaster Intelligence & Coordinated Emergency Response Platform  
**Active Phase**: Phase 5 — Production Readiness & Deployment  
**Authorized Repository**: `https://github.com/singhrohit09/RAKSHAGRID.git`

---

## 1. Executive Security Architecture

RakshaGrid is designed for state and municipal emergency response operations where integrity, availability, and non-repudiation are vital. The platform implements defense-in-depth across the application lifecycle:

```
+-------------------------------------------------------------------------------+
|                             INCOMING CLIENT REQUEST                           |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| 1. PERIMETER & TRANSPORT DEFENSE                                              |
|    - Strict CORS with explicit origin whitelist (rejects wildcard origins)    |
|    - Anti-CSRF verification (custom X-Raksha-CSRF & X-Requested-With headers) |
|    - Standard HTTP security headers: nosniff, DENY framing, HSTS (production) |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| 2. RATE LIMITING & THREAT DEFENSE                                             |
|    - Authentication rate limiting: 10 requests / minute                       |
|    - Password recovery rate limiting: 5 requests / 15 minutes                 |
|    - AI agent dispatch rate limiting: 30 requests / minute                    |
|    - General API rate limiting: 120 requests / minute                         |
|    - In-memory sliding-window (single-node) with optional Redis cluster       |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| 3. AUTHENTICATION & SESSION HYGIENE                                           |
|    - Bcrypt password hashing (salt rounds: 10)                                |
|    - 256-bit signed JSON Web Tokens stored in HttpOnly, SameSite=Lax cookies  |
|    - Production requirement: 32+ character high-entropy JWT_SECRET            |
|    - Complete cookie invalidation on logout with matching secure attributes   |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| 4. ROLE-BASED ACCESS CONTROL (RBAC) & PRIVILEGE GUARD                         |
|    - Public registration strictly assigns standard responder permissions      |
|    - Privilege escalation rejected: Cannot self-assign admin/commander (403) |
|    - Protected server middleware checks granular permission sets              |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| 5. HUMAN-IN-THE-LOOP AI GOVERNANCE                                            |
|    - Zero autonomous emergency dispatch, zero auto-alerting, zero inventory  |
|    - Recommendations staged as 'pending'; requires commander approval (403)   |
|    - Atomic database transaction (db.transaction()) executes real domain      |
|    - Immutable operational audit trail recorded in audit_events               |
+-------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------+
| 6. DATABASE ACCESS & PARAMETERIZATION                                         |
|    - Parameterized ANSI SQL queries across both SQLite 3 and PostgreSQL       |
|    - Zero string concatenation in SQL queries (SQLi immune)                   |
|    - Scoped connection client pooling using AsyncLocalStorage                 |
+-------------------------------------------------------------------------------+
```

---

## 2. Authentication & Session Management

### A. Password Security Policies
- **Hashing Algorithm**: Bcrypt with work factor 10.
- **Complexity Requirements**: Enforced by `isPasswordStrong()` in `server/config/security.ts`:
  - Minimum length: 10 characters.
  - Requires at least one uppercase letter (`[A-Z]`).
  - Requires at least one lowercase letter (`[a-z]`).
  - Requires at least one numerical digit (`[0-9]`).
  - Requires at least one special character symbol (`[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]`).
- **First-Administrator Provisioning**:
  - Secure first-admin setup via `npm run server:bootstrap-admin` or `INITIAL_ADMIN_PASSWORD` environment variable.
  - Default predictable passwords have been removed from source control and documentation.

### B. Session Cookies & Token Lifetime
- Tokens signed using HMAC SHA-256 with an 8-hour lifetime (`maxAge: 28800000`).
- Delivered via `HttpOnly` cookies (`raksha_session`):
  - `httpOnly: true`: Prevents client-side script access (mitigating XSS token theft).
  - `sameSite: 'lax'`: Protects against Cross-Site Request Forgery during external navigations.
  - `secure: true`: Enforced when `NODE_ENV === 'production'` over HTTPS.
- Tokenized password reset tokens use single-use cryptographic hashes (`crypto.randomBytes(32)` hashed with SHA-256) stored with a 1-hour expiration. Stored token hashes are atomically deleted upon successful password reset.

---

## 3. Authorization & RBAC Boundaries

The platform strictly segregates responsibilities across five personas:
- **`admin`**: Full system governance, first-admin provisioning, user role management, system settings, audit inspection.
- **`commander`**: Incident escalation, operational team assignments, alert authoring & approval, AI recommendation approval.
- **`responder`**: Incident status updates, field task progress tracking. Cannot approve AI recommendations, cannot dispatch alerts, cannot manage inventory.
- **`logistics`**: Shelter capacity management, relief warehouse inventory allocation, mutual aid supply matching.
- **`analyst`**: Geospatial hazard evaluation, weather/hydrology monitoring, disaster simulation runs, audit log inspection.

### Privilege Escalation Protections:
- `POST /api/auth/register` actively verifies the requested role:
  - If a user attempts to supply `role: "admin"` or `role: "commander"`, the request is immediately aborted with `HTTP 403 Forbidden` (`"Privilege escalation rejected: Administrative or command roles cannot be self-assigned via public registration."`).
  - Only authorized administrators can alter user roles via `PUT /api/auth/users/:id/role`.

---

## 4. API Security, Input Validation & Headers

### A. HTTP Security Headers
Every API response delivers hardened headers:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), camera=(), microphone=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (production)
```

### B. CORS Configuration
- Rejects wildcard (`*`) origins when credentials are enabled (`credentials: true`).
- Validates the `Origin` header against an explicit whitelist comprising `CLIENT_ORIGIN` and local development hosts. Unapproved origins receive `HTTP 403 Forbidden`.

### C. CSRF Defense
- Evaluates custom anti-CSRF headers (`X-Requested-With`, `X-Raksha-CSRF: 1`) on state-changing mutation endpoints (`POST`, `PUT`, `DELETE`, `PATCH`).

### D. Input Sanitization & Parameter Validation
- Coordinate validation: Latitude strictly enforced between `-90.0` and `+90.0`; longitude between `-180.0` and `+180.0`.
- Text inputs sanitized: Query lengths capped at 1,000 characters; simulation rainfall rates clamped between `0` and `500 mm/hr`.
- JSON request payload size limited to `5mb` to prevent payload bloat denial-of-service.

---

## 5. Rate Limiting Architecture

| Limiter Instance | Rate Limit Threshold | Target Endpoints | Behavior on Breach |
|---|---|---|---|
| `authRateLimiter` | 10 requests / minute | `POST /api/auth/login`, `POST /api/auth/register` | `HTTP 429 Too Many Requests` (`Retry-After: N`) |
| `passwordResetRateLimiter` | 5 requests / 15 minutes | `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | `HTTP 429 Too Many Requests` |
| `aiRateLimiter` | 30 requests / minute | `/api/ai/risk/analyze`, `/api/ai/coordinator/run`, `/api/ai/simulation/run` | `HTTP 429 Too Many Requests` |
| `apiRateLimiter` | 120 requests / minute | General operational endpoints | `HTTP 429 Too Many Requests` |

### Multi-Instance & Redis Consideration:
- **Single-Node Container Deployment**: Operates with the high-performance in-memory sliding-window limiter.
- **Horizontal Multi-Pod Deployment**: If multiple backend instances are scaled horizontally behind a round-robin load balancer, configuring `REDIS_URL` in the environment activates distributed token bucket synchronization.

---

## 6. Secrets Management & Environment Isolation

1. **Server-Side Exclusivity**: Secrets (`JWT_SECRET`, `AI_API_KEY`, `INITIAL_ADMIN_PASSWORD`, `DATABASE_URL`) are read exclusively from backend server environment variables.
2. **Git Exclusion**: `.env` is strictly tracked in `.gitignore`. Tracked sample files (`.env.example`) provide placeholder values only.
3. **Startup Validation**: `validateProductionEnvironment()` in `server/config/security.ts` executes at server launch:
   - If `NODE_ENV === 'production'` and `JWT_SECRET` is missing, shorter than 32 characters, or matches a known placeholder, the process halts immediately with a fatal error.
4. **Execution History Sanitization**: Database queries and audit execution logs strip all credentials and session tokens before persisting output records.

