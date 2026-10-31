# RakshaGrid — Production Deployment & Infrastructure Guide

This guide details the deployment options, environment variable configurations, containerization, and verification procedures for **RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform**.

---

## 1. Supported Deployment Topologies

| Topology | Use Case | Frontend | Backend & DB |
|----------|----------|----------|--------------|
| **Option A: Unified Full-Stack Container (Recommended)** | Render, Railway, AWS ECS, Fly.io, Self-Hosted Docker | Express serves compiled SPA (`dist`) | Express Node.js + PostgreSQL |
| **Option B: Split Decoupled Topology** | Vercel Edge CDN + Cloud PaaS Backend | Vercel (`vercel.json`) | Render / Railway API Web Service |
| **Option C: Air-Gapped / Field Emergency Node** | Disaster Site On-Premises Laptop / Rugged Server | Embedded Vite Build | Node.js + Local SQLite WAL file |

---

## 2. Production Environment Variables Checklist

Before deploying, ensure the following environment variables are securely set in your hosting platform's secrets manager:

| Variable | Required | Description | Example / Recommendation |
|----------|----------|-------------|--------------------------|
| `NODE_ENV` | **Yes** | Sets runtime mode to production | `production` |
| `PORT` | **Yes** | Internal server listening port | `5000` (Render default: `10000`) |
| `CLIENT_ORIGIN` | **Yes** | Allowed CORS origin for credentials/cookies | `https://rakshagrid.onrender.com` or `https://rakshagrid.vercel.app` |
| `JWT_SECRET` | **Yes** | 64+ char cryptographically random secret | Generate via `npm run generate-secret` |
| `DATABASE_URL` | Optional | PostgreSQL connection string | `postgresql://user:pass@host:5432/rakshagrid` |
| `DATABASE_SSL` | Optional | Set to `true` if hosting on Render/Supabase/Neon | `true` |
| `INITIAL_ADMIN_PASSWORD` | Optional | Initial bootstrap password for `admin@rakshagrid.gov.in` | Strong password (min 12 chars, upper, lower, digit, symbol) |
| `OPENAI_API_KEY` | Optional | External LLM key for live AI Agent streaming | If omitted, deterministic Rule-Based Intelligence engine runs |
| `ANTHROPIC_API_KEY` | Optional | Claude API key fallback | Optional |
| `GEMINI_API_KEY` | Optional | Google Gemini API key fallback | Optional |

> [!CAUTION]
> Never commit `.env` or paste real API keys and secrets into version control. Set them exclusively via your cloud provider's dashboard or CLI secret injector.

---

## 3. Option A: Unified Container Deployment (Render / Railway)

### Using Render Infrastructure-as-Code (`render.yaml`)
1. Fork or push the RakshaGrid repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Blueprint**.
3. Connect your repository `singhrohit09/RAKSHAGRID`.
4. Render detects `render.yaml` and provisions:
   - **rakshagrid-platform**: Node.js Web Service running `npm install && npm run build` and `npm start`.
   - **rakshagrid-db**: Managed PostgreSQL instance automatically wiring `DATABASE_URL`.
5. Under **Environment Variables**, set:
   - `CLIENT_ORIGIN`: Your assigned Render domain (e.g. `https://rakshagrid-platform.onrender.com`).
6. Click **Apply**. The service compiles the React frontend, builds the server, initializes the database schema, and passes the `/api/health` health check.

### Manual Render Setup:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/api/health`

---

## 4. Option B: Split Decoupled Deployment (Vercel Frontend + Render Backend)

### Frontend Deployment on Vercel:
1. Import `singhrohit09/RAKSHAGRID` into [Vercel](https://vercel.com).
2. Framework Preset: **Vite**.
3. Root Directory: `./`.
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (e.g. `https://rakshagrid-api.onrender.com`).
7. Deploy. `vercel.json` provides automatic SPA path routing to `index.html` and HTTP security headers.

### Backend Setup:
Ensure the backend's `CLIENT_ORIGIN` matches your Vercel URL (e.g. `https://rakshagrid.vercel.app`) to permit authenticated cookie exchange.

---

## 5. Option C: Self-Hosted Container Deployment (Docker Compose)

For cloud VMs (AWS EC2, DigitalOcean Droplet, GCP Compute Engine) or local command centers:

```bash
# 1. Clone repository
git clone https://github.com/singhrohit09/RAKSHAGRID.git
cd RAKSHAGRID

# 2. Generate secure JWT secret
npm run generate-secret

# 3. Configure production credentials in docker-compose.yml or .env.production
# 4. Launch containers in background
docker compose up -d --build

# 5. Check container logs and health
docker compose ps
docker compose logs -f app
```

Verify service availability:
```bash
curl -I http://localhost:5000/api/health
```

---

## 6. First Administrator Provisioning in Production

When deploying to a fresh database with no users:

### Method 1: Environment Variable Bootstrap
Provide `INITIAL_ADMIN_PASSWORD` during first launch. RakshaGrid automatically seeds the initial administrator account:
- **Email**: `admin@rakshagrid.gov.in`
- **Password**: Value from `INITIAL_ADMIN_PASSWORD`

### Method 2: One-Time CLI Bootstrap Utility
Run the one-time interactive/headless bootstrap script inside the container or server:
```bash
npm run server:bootstrap-admin
```
The script validates password entropy and provisions `admin@rakshagrid.gov.in` safely without logging plaintext secrets.

---

## 7. Verification & Post-Deployment Checklist

Execute these checks immediately after any deployment:

1. **System Health Check**:
   ```bash
   curl -s https://<your-domain>/api/system/health | jq .
   ```
   Confirm `"status": "healthy"` and `"database": { "status": "connected" }`.

2. **Security Headers Verification**:
   ```bash
   curl -I https://<your-domain>/api/health
   ```
   Confirm headers are present:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`

3. **Authentication & Session Exchange**:
   - Access the login UI.
   - Log in with administrator credentials.
   - Inspect network tab to verify `Set-Cookie: raksha_session` has `HttpOnly`, `SameSite=Lax`, and `Secure` (in HTTPS).

4. **GIS Map & Telemetry Sync**:
   - Navigate to `/map` and `/incidents`.
   - Verify Open-Meteo live weather updates for current incident coordinates.
