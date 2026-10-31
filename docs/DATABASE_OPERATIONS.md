# RakshaGrid — Production Database Reliability & Operations Guide

This document defines the production database architecture, reliability engineering, backup strategies, and migration management for **RakshaGrid — Disaster Intelligence and Coordinated Emergency Response Platform**.

---

## 1. Dual-Dialect Database Engine

RakshaGrid supports a zero-friction dual database tier:
1. **SQLite (WAL Mode)**: Default for local development, air-gapped test nodes, and low-latency single-instance edge deployments.
2. **PostgreSQL 14+ / Supabase / Neon / AWS RDS**: Production multi-container enterprise engine with high concurrency and horizontal pool scaling.

The platform automatically detects the environment and switches engines based on the presence of `DATABASE_URL`:
- If `DATABASE_URL` starts with `postgres://` or `postgresql://`, the `pg.Pool` client is initialized.
- Otherwise, `better-sqlite3` with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and Foreign Keys (`PRAGMA foreign_keys = ON`) is activated.

---

## 2. PostgreSQL Connection Pooling & Tuning

### Pool Configuration Settings
In `server/db/connection.ts`, the PostgreSQL connection pool is tuned for resilient disaster response workloads:

| Environment Variable | Default | Purpose |
|----------------------|---------|---------|
| `DATABASE_URL` | None | PostgreSQL connection URI (`postgresql://user:pass@host:5432/dbname`) |
| `DB_POOL_MAX` | `20` | Maximum simultaneous checked-out connections in the pool |
| `DATABASE_SSL` | `false` | When `true` or when URI contains `sslmode=require`, enables TLS with self-signed certificate acceptance |
| `idleTimeoutMillis` | `30000` | Connections idle for > 30s are pruned from the pool |
| `connectionTimeoutMillis` | `5000` | Aborts connection attempts hanging beyond 5 seconds |

### Connection Fault Resilience
The pool registers background error handling:
```typescript
this.pgPool.on('error', (err) => {
  console.error('⚠️ RakshaGrid PostgreSQL Pool Client Error:', err.message);
});
```
This guarantees idle client socket disconnects (e.g., cloud database restarts, network blips) do not terminate the Node.js server process.

---

## 3. Transaction Safety & Concurrency Scoping

Emergency response actions (such as allocating medical and rescue resources, approving AI dispatch plans, or recording multi-hazard incidents) require strict atomic consistency.

RakshaGrid guarantees transaction safety across both database engines:

### PostgreSQL: Scoped PoolClient with AsyncLocalStorage
When `db.transaction(fn)` is invoked:
1. A dedicated `pg.PoolClient` is checked out from the pool.
2. `BEGIN` is issued on that dedicated client.
3. The client is stored in Node.js `AsyncLocalStorage<pg.PoolClient>`.
4. All nested queries within the asynchronous context use this exact client.
5. On success, `COMMIT` is executed.
6. On error or exception, `ROLLBACK` is executed, and the client is released back to the pool in a `finally` block.

### SQLite: Immediate Transaction Locking
1. SQLite uses `BEGIN IMMEDIATE` to prevent read/write starvation and lock escalation deadlocks during high-concurrency writes.
2. On failure, `ROLLBACK` is executed safely.

---

## 4. Schema Synchronization & Migrations

The database schema is defined in [schema.sql](file:///d:/RakshaGrid/server/db/schema.sql) using portable ANSI SQL:
- All tables define `CREATE TABLE IF NOT EXISTS`.
- All secondary indexes define `CREATE INDEX IF NOT EXISTS`.
- Foreign key constraints use standard `REFERENCES table(id) ON DELETE CASCADE / SET NULL`.

### Schema Initialization
Upon server start or worker boot, `db.initSchema()` is invoked idempotently:
```bash
# Explicit migration / schema check
npm run server:seed
```

---

## 5. Production Backup & Disaster Recovery Procedures

### PostgreSQL Production Backup

#### Daily Logical Backup:
```bash
# Automated logical backup using pg_dump
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --file="/backup/rakshagrid_$(date +%Y%m%d_%H%M%S).dump"
```

#### Production Point-In-Time Restore:
```bash
# Restore to target database cluster
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  "/backup/rakshagrid_20261101_000000.dump"
```

### SQLite Local / Edge Node Backup

SQLite WAL databases can be backed up online without taking the service offline:
```bash
# Run online VACUUM INTO command
sqlite3 server/data/rakshagrid.db "VACUUM INTO 'server/data/backup_rakshagrid_$(date +%Y%m%d).db';"
```

---

## 6. Database Health Monitoring & Observability

The platform exposes real-time database health diagnostics via `GET /api/system/health`:
```json
{
  "status": "healthy",
  "operationalMode": "LIVE_PRODUCTION",
  "database": {
    "status": "connected",
    "dialect": "postgres",
    "latencyMs": 4,
    "activeIncidents": 12,
    "activeGeofences": 8
  }
}
```
If database query latency exceeds 500ms or connection fails, the endpoint returns HTTP 503 `degraded`, triggering automated health-check alerts in orchestrators like Kubernetes, Docker Swarm, or Render health probes.
