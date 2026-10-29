# RakshaGrid Architecture Documentation (Phase 2 Full-Stack)

## System Overview

**RakshaGrid** is a specialized disaster intelligence and coordinated emergency operations platform. It is engineered to give Emergency Operations Centers (EOC), Incident Commanders, and field relief authorities situational awareness, tactical coordination tools, resource logistics tracking, and simulated public alert drafting during major emergencies.

Phase 2 elevates the platform from a client-side prototype to a full-stack, enterprise-grade emergency operations system with a real relational database, secure session authentication, server-enforced Role-Based Access Control (RBAC), and server-validated business rules.

```
                           +--------------------------------------+
                           |        Browser User Interface        |
                           +--------------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         +-----------------------+                         +-----------------------+
         | Internal Ops Shell    |                         | Public Bulletin Portal|
         | (/dashboard, /map,    |                         | (/public)             |
         |  /incidents, /teams,  |                         | Public warnings,      |
         |  /shelters, /tasks...) |                         | shelter info, guides  |
         +-----------------------+                         +-----------------------+
                     \                                                 /
                      \-----------------------+-----------------------/
                                              |
                                              v
                              +-------------------------------+
                              |     RakshaGrid Data Store     |
                              |  (React Context + API Client) |
                              +-------------------------------+
                                              |
                         +--------------------+--------------------+
                         |                                         |
     (When Offline / Demo Mode)                           (When Online)
                         |                                         |
                         v                                         v
         +-------------------------------+         +-------------------------------+
         |    Versioned LocalStorage     |         |     Express REST API Layer    |
         |  Schema: rakshagrid_state_v1  |         |   (Port 5000 /api endpoints)  |
         +-------------------------------+         +-------------------------------+
                                                                   |
                                            +----------------------+----------------------+
                                            |                      |                      |
                                            v                      v                      v
                                 +--------------------+ +--------------------+ +--------------------+
                                 | JWT Session Auth & | | RBAC Authorization | | Business Rule &    |
                                 | Password Hashing   | | (5 Personas Matrix)| | Safety Validators  |
                                 +--------------------+ +--------------------+ +--------------------+
                                            |                      |                      |
                                            +----------------------+----------------------+
                                                                   |
                                                                   v
                                                   +-------------------------------+
                                                   |    Relational Database Layer  |
                                                   |  (PostgreSQL || SQLite (WAL)) |
                                                   | 11 Normalized Tables + Audit  |
                                                   +-------------------------------+
```

---

## Backend Architecture & Database Selection

### 1. Dual-Adapter Database Engine
To guarantee zero-friction local development without requiring external database installations, RakshaGrid implements a dual-adapter database client (`server/db/connection.ts`):
- **Production Mode (PostgreSQL)**: When `DATABASE_URL` is set, connects via connection pooling (`pg.Pool`).
- **Local/Embedded Mode (SQLite)**: When `DATABASE_URL` is omitted, automatically spins up embedded `better-sqlite3` at `server/data/rakshagrid.db` with Write-Ahead Logging (`WAL` mode) and foreign key enforcement enabled.
- Both engines share the exact same ANSI SQL schema (`server/db/schema.sql`) and ACID transactional semantics.

### 2. Normalized Relational Schema
The database contains 11 normalized tables:
- `users`: Authenticated personnel profiles with bcrypt hashed passwords (`$2a$10$...`), roles, departments, callsigns.
- `teams`: Specialized response battalions, staff counts, disciplinary skills (JSON), coordinates, statuses.
- `shelters`: Evacuation shelter facilities, capacities, current occupancies, regions, notes.
- `resources`: Logistics inventory items, minimum thresholds, quantities available and allocated.
- `inventory_movements`: Immutable transactional ledger tracking stock allocations, releases, actor IDs, and notes.
- `incidents`: Disaster incidents with categories, severities, coordinates, priorities, affected population, casualties.
- `incident_timeline`: Chronological audit entries linked to parent incident IDs.
- `tasks`: Response Kanban tasks, priority, statuses, foreign keys to related incidents and response teams.
- `alerts`: CAP-inspired emergency alerts, safety actions, distribution channels, approval metadata.
- `audit_events`: Application-level operational audit log recording timestamp, actor ID, name, role, action, entity type, entity ID, and description.
- `password_reset_tokens`: SHA-256 hashed 15-minute expiring tokens for secure password recovery.
- `system_settings`: Key-value configuration for operational region, defaults, and feed toggles.
- `notifications`: In-app operational alerts and broadcasts.

---

## Authentication & Authorization (RBAC)

### 1. Secure Authentication Flow
- Passwords are encrypted using `bcryptjs` with salt work factor 10.
- Sessions are maintained using cryptographically signed JSON Web Tokens (JWT).
- Tokens are delivered via `HttpOnly`, `SameSite=Lax` cookies named `raksha_session` (with fallback support for `Authorization: Bearer <token>` headers).
- User profile endpoint `GET /api/auth/me` validates the token on every session handshake and returns granted permissions.

### 2. Five Operational Personas
The system enforces strict server-side RBAC across 5 defined roles:

| Persona | Role | Permissions Summary |
|---|---|---|
| **Director Rajesh Verma** | `admin` | Full operational authority, incident management, alerts, settings, system reset. |
| **Cmdr. Ananya Sen** | `commander` | Incident command, team dispatch, task assignment, alert review & approval. |
| **Vikramaditya Rao** | `responder` | Field operational view, incident status updates, task execution. |
| **Pooja Kulkarni** | `logistics` | Shelter management, inventory allocation/release, task execution. |
| **Dr. Siddharth Mehta** | `analyst` | Read-only situational awareness, analytics, audit log inspection. |

Requests to restricted routes without appropriate permissions return `HTTP 403 Forbidden`.

### 3. Production Security Hardening
- **Secret Hygiene & Startup Validation**: Cryptographically random 256-bit secrets are generated outside source control (`npm run generate-secret`). During production startup, `server/config/security.ts` asserts that `JWT_SECRET` is set, at least 32 characters, and not set to known placeholder defaults.
- **First-Administrator Provisioning**: Provisioned via secure CLI tool (`npm run server:bootstrap-admin`) or `INITIAL_ADMIN_PASSWORD` environment variable. Never exposes bootstrap credentials in logs or API responses.
- **Privilege Escalation Guard**: Public user registration (`/api/auth/register`) strictly assigns standard responder permissions and rejects attempts to self-grant `admin` or `commander` roles with `HTTP 403 Forbidden`. Admin role promotion is strictly restricted to verified administrators (`PUT /api/auth/users/:id/role`).
- **Password Strength Policy**: Enforces a minimum of 10 characters with uppercase, lowercase, numeric, and symbol classes.
- **Rate Limiting Middleware**: Sliding-window rate limiting on authentication routes (10 requests/min) and password reset (5 requests/15 min) prevents credential stuffing and brute-force attacks (`server/middleware/rateLimiter.ts`).
- **CSRF Protection**: For cookie-authenticated mutation requests (`POST`, `PUT`, `DELETE`), `server/middleware/csrf.ts` enforces origin/referer matching and requires custom client verification headers (`X-Requested-With`, `X-Raksha-CSRF`).
- **Tokenized Password Reset Flow**: Secure 15-minute token lifecycle with SHA-256 storage and constant-time user enumeration defense (`POST /api/auth/forgot-password` and `POST /api/auth/reset-password`).
- **CORS Lockdown**: Validates request origins against configured whitelist (`CLIENT_ORIGIN`) and blocks unauthorized origins without reflection when credentials are used.
- **Demo Isolation**: UI persona switching is isolated to local simulation; in live mode, identity and authorizations are strictly governed by authenticated server sessions.

---

## Server-Side Business Rules & Safety Guardrails

The API layer enforces safety rules independently of client-side validation:
1. **Negative Inventory Prevention**: Allocations exceeding available depot stock are rejected (`HTTP 400 Insufficient stock`). Allocations and releases write an audit record to `inventory_movements`.
2. **Shelter Capacity Overflow Guard**: Setting shelter headcount above maximum capacity is blocked (`HTTP 400 EXCEEDS_CAPACITY`) unless an explicit administrative override flag (`allowOverflow: true` / `forceOverride: true`) is submitted.
3. **Geographic Coordinate Validation**: Incident and team coordinates are bounded to valid terrestrial limits (latitude between -90 and 90, longitude between -180 and 180).
4. **Application-Level Operational Audit Trail**: All mutations across incidents, teams, shelters, resources, tasks, alerts, and settings write an operational record to `audit_events`. Sensitive payload items (passwords, tokens, cookies) are automatically redacted before persistence.

---

## Folder & Component Structure

```
d:\RakshaGrid\
├── index.html                  # HTML entry point with Plus Jakarta Sans & JetBrains Mono fonts
├── vite.config.ts              # Vite 5 + React plugin + API Proxy + Vitest config
├── tailwind.config.js          # Tactical operations design tokens
├── package.json                # Dependencies and npm script targets
├── tsconfig.json               # Frontend TypeScript configuration
├── tsconfig.server.json        # Backend TypeScript configuration
├── .env.example                # Full-stack configuration blueprint
├── server/                     # Full-Stack Backend Layer
│   ├── index.ts                # Main Express application & middleware setup
│   ├── config/                 # Security policies and configuration
│   │   └── security.ts         # JWT validation, password policies, secret hygiene
│   ├── auth/                   # JWT signing, verification, and role definitions
│   │   ├── jwt.ts              # Token issue and cookie extraction
│   │   └── roles.ts            # Server-side persona permission matrix
│   ├── db/                     # Database connection & migrations
│   │   ├── connection.ts       # Dual PostgreSQL/SQLite client adapter
│   │   └── schema.sql          # Normalized relational schema (12 tables including password resets)
│   ├── middleware/             # Express middlewares
│   │   ├── auth.ts             # Session verification middleware
│   │   ├── rbac.ts             # Permission-checking middleware (401/403)
│   │   ├── audit.ts            # Operational audit recording helper
│   │   ├── csrf.ts             # CSRF origin & custom header verification
│   │   └── rateLimiter.ts      # Sliding-window brute force protection
│   ├── routes/                 # REST API endpoints
│   │   ├── alerts.routes.ts    # Alert drafting, review, demo approval
│   │   ├── audit.routes.ts     # Audit log retrieval & CSV export
│   │   ├── auth.routes.ts      # Login, registration, profile, password recovery
│   │   ├── incidents.routes.ts # Incident CRUD, coordinates, timeline
│   │   ├── notifications.routes.ts # Notification management
│   │   ├── resources.routes.ts # Inventory allocation & ledger
│   │   ├── settings.routes.ts  # System settings & baseline reset
│   │   ├── shelters.routes.ts  # Shelter registry & occupancy guards
│   │   ├── tasks.routes.ts     # Kanban tasks & assignments
│   │   └── teams.routes.ts     # Response team roster
│   ├── scripts/                # Database and provisioning utilities
│   │   ├── seed.ts             # Baseline scenario seed script
│   │   ├── bootstrap-admin.ts  # Secure first-administrator provisioning
│   │   └── generate-secret.ts  # Cryptographic secret generation CLI
│   └── tests/                  # Backend integration & security tests
│       ├── api.test.ts         # Supertest integration test suite
│       └── security.test.ts    # Security hardening regression suite (17 tests)
├── src/                        # Frontend Application Layer
│   ├── main.tsx                # React root mount
│   ├── App.tsx                 # Route declarations & provider nesting
│   ├── services/               # Client-side API layer
│   │   └── api.ts              # Typed REST client with credentials
│   ├── types/                  # Shared data models
│   ├── data/                   # Initial fixtures & seed states
│   ├── context/                # Reactive state management
│   │   └── RakshaContext.tsx   # Store with backend synchronization & offline fallback
│   ├── utils/                  # Permissions, formatters, CSV export
│   ├── components/             # Reusable UI components
│   ├── pages/                  # 12 operational views
│   └── tests/                  # Unit and domain business rule tests
└── docs/                       # Project documentation
    ├── ARCHITECTURE.md         # Full system architecture
    ├── DEVELOPMENT_LOG.md      # Mandatory Git milestone history
    └── PHASE_ROADMAP.md        # Long-term development roadmap
```

---

## Verification & Test Automation

The repository enforces complete test coverage across frontend domain operations, backend REST endpoints, and security hardening:
- **`npm test`**: Runs Vitest across 56 tests (17 security regression + 18 backend integration + 21 frontend domain operations).
- **`npm run lint`**: Strict dual-compiler type checking (`tsc --noEmit` and `tsc -p tsconfig.server.json --noEmit`).
- **`npm run build`**: Production bundling via Vite.
