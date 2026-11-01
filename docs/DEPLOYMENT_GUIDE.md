# RakshaGrid — Production Deployment Guide

---

## 1. Prerequisites Checklist

Before deploying RakshaGrid to production, verify you have:
- Node.js v20.x or v22.x LTS installed
- Git CLI configured
- A Supabase Project (PostgreSQL 15+)
- A Vercel or Cloudflare Pages hosting account
- An optional Google Gemini API Key (for LLM generative synthesis)
- An optional OpenWeather API Key (for real-time weather stations)

---

## 2. Step 1: Database Setup (Supabase)

1. Navigate to your [Supabase Dashboard](https://supabase.com).
2. Create a new project named `rakshagrid-production`.
3. Open the **SQL Editor** in your Supabase project.
4. Execute the migration files located in `supabase/migrations/`:
   - `supabase/migrations/20261101_phase4_ai_intelligence.sql`
5. Verify tables are provisioned with Row-Level Security (RLS) enabled:
   - `incidents`
   - `emergency_alerts`
   - `resources`
   - `shelters`
   - `teams`
   - `tasks`
   - `audit_events`
   - `ai_situation_reports`
   - `ai_scenarios`
6. Go to **Project Settings -> API** and copy:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon / public key** (`eyJhbGci...`)

---

## 3. Step 2: Environment Variables Configuration

In your production deployment dashboard (e.g. Vercel Project Settings -> Environment Variables), configure the following:

| Variable Name | Required | Example / Description |
| :--- | :---: | :--- |
| `VITE_APP_ENV` | Yes | `production` |
| `VITE_DISASTER_NODE_ID` | Yes | `IN-EOC-PRIMARY-01` |
| `VITE_DEFAULT_COMMAND_REGION`| Yes | `Eastern & Coastal Command Hub` |
| `VITE_SUPABASE_URL` | Optional | `https://your-project.supabase.co` (Falls back to local cache if blank) |
| `VITE_SUPABASE_ANON_KEY` | Optional | `eyJhbGciOi...` (Public client key) |
| `VITE_OPENWEATHER_API_KEY` | Optional | `your_openweather_key` |
| `GEMINI_API_KEY` | Optional | `AIzaSy...` (Injected automatically in AI Studio) |

> **CRITICAL SECURITY NOTE:**  
> NEVER set `SUPABASE_SERVICE_ROLE_KEY` or database root credentials in client environment settings.

---

## 4. Step 3: Deploying to Vercel

### Option A: Via GitHub Integration (Recommended)
1. Push your repository to `https://github.com/singhrohit09/RAKSHAGRID.git`.
2. In Vercel, click **Add New Project** and import the `RAKSHAGRID` repository.
3. Framework Preset: **Vite**
4. Root Directory: `./`
5. Build Command: `npm run build`
6. Output Directory: `dist`
7. Add the environment variables from Step 2.
8. Click **Deploy**. Vercel will build and deploy the application. SPA routing and security headers are automatically applied via `vercel.json`.

### Option B: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 5. Step 4: Health Checks & Verification Runbook

Once deployed, execute the following verification steps on the live domain:
1. **Public Portal Health:**
   - Open `https://<your-domain>/`. Verify public incidents and active emergency alerts render immediately.
2. **Authentication Guard:**
   - Attempt to navigate directly to `https://<your-domain>/dashboard`.
   - Verify unauthenticated users are smoothly redirected to the login screen with an explanatory banner.
3. **Demo Persona Sign-In:**
   - Click "Incident Commander" demo login. Verify transition to operational dashboard within <500ms.
4. **Geospatial GIS Engine:**
   - Navigate to `/map`. Verify CartoDB/OpenStreetMap tiles load, incident marker pins appear, and risk proximity rings calculate accurately.
5. **Multi-Agent AI Intelligence:**
   - Navigate to `/ai-intelligence`.
   - Click "Execute Swarm Assessment". Verify all 7 agent runs render and synthesize into the Situation Awareness Report.
6. **Scenario Simulator:**
   - In `/ai-intelligence`, adjust rainfall multiplier to `2.5x` and click "Run What-If Simulation".
   - Verify calculation completes with permanent `SIMULATION ONLY` watermark and zero mutation on baseline live incidents.
7. **Offline Resilience:**
   - Open Chrome DevTools -> Network -> Select "Offline".
   - Verify tactical amber warning banner appears (`DISCONNECTED — Operating in resilient offline cache mode`).
   - Switch back to "Online" and verify green sync notification appears (`GRID ONLINE`).

---

## 6. Rollback Procedures

If an unexpected production defect occurs after deployment:
1. **Instant Rollback via Vercel:**
   - In Vercel Dashboard -> **Deployments**, locate the previous stable build and click **Promote to Production**. Rollback completes in <5 seconds.
2. **Local Data Reset:**
   - Operators can click **Settings -> Reset Demo Operational Data** to restore the verified baseline state instantly.
