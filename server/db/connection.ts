import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AsyncLocalStorage } from 'node:async_hooks';
import Database from 'better-sqlite3';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Scoped transaction storage ensuring Postgres queries inside transactions use the checked-out PoolClient
const pgTxStorage = new AsyncLocalStorage<pg.PoolClient>();

export interface QueryResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

export class DatabaseClient {
  private sqliteDb: Database.Database | null = null;
  private pgPool: pg.Pool | null = null;
  private isPostgres = false;

  constructor(customDbPath?: string) {
    const dbUrl = process.env.DATABASE_URL;

    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
      this.isPostgres = true;
      const useSsl = process.env.DATABASE_SSL === 'true' || dbUrl.includes('sslmode=require');
      this.pgPool = new pg.Pool({
        connectionString: dbUrl,
        max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {})
      });

      // Handle background errors on idle pool clients without terminating process
      this.pgPool.on('error', (err) => {
        console.error('⚠️ RakshaGrid PostgreSQL Pool Client Error:', err.message);
      });

      console.log('✅ RakshaGrid Database: Connected to PostgreSQL server.');
    } else {
      this.isPostgres = false;
      const dbPath = customDbPath || process.env.SQLITE_PATH || path.join(__dirname, '../data/rakshagrid.db');
      
      if (dbPath !== ':memory:') {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      this.sqliteDb = new Database(dbPath);
      this.sqliteDb.pragma('journal_mode = WAL');
      this.sqliteDb.pragma('foreign_keys = ON');
      console.log(`✅ RakshaGrid Database: Connected to SQLite (${dbPath}).`);
    }
  }

  public getEngine(): 'postgres' | 'sqlite' {
    return this.isPostgres ? 'postgres' : 'sqlite';
  }

  public async ping(): Promise<{ ok: boolean; dialect: 'sqlite' | 'postgres'; latencyMs: number }> {
    const start = Date.now();
    try {
      const res = await this.get<{ ok: number }>('SELECT 1 as ok');
      return {
        ok: Boolean(res && res.ok === 1),
        dialect: this.getEngine(),
        latencyMs: Date.now() - start
      };
    } catch {
      return {
        ok: false,
        dialect: this.getEngine(),
        latencyMs: Date.now() - start
      };
    }
  }

  public async initSchema(): Promise<void> {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');

    if (this.isPostgres && this.pgPool) {
      await this.pgPool.query(schemaSql);
    } else if (this.sqliteDb) {
      this.sqliteDb.exec(schemaSql);
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isPostgres && this.pgPool) {
      const activeExecutor = pgTxStorage.getStore() || this.pgPool;
      let pIdx = 1;
      const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
      const res = await activeExecutor.query(pgSql, params);
      return res.rows as T[];
    } else if (this.sqliteDb) {
      // Convert $1, $2, etc. to ? if Postgres style was used
      const sqliteSql = sql.replace(/\$\d+/g, '?');
      const stmt = this.sqliteDb.prepare(sqliteSql);
      return stmt.all(...params) as T[];
    }
    throw new Error('Database client not initialized.');
  }

  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.query<T>(sql, params);
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  public async run(sql: string, params: any[] = []): Promise<QueryResult> {
    if (this.isPostgres && this.pgPool) {
      const activeExecutor = pgTxStorage.getStore() || this.pgPool;
      let pIdx = 1;
      const pgSql = sql.replace(/\?/g, () => `$${pIdx++}`);
      const res = await activeExecutor.query(pgSql, params);
      return {
        changes: res.rowCount || 0
      };
    } else if (this.sqliteDb) {
      const stmt = this.sqliteDb.prepare(sql);
      const res = stmt.run(...params);
      return {
        changes: res.changes,
        lastInsertRowid: res.lastInsertRowid
      };
    }
    throw new Error('Database client not initialized.');
  }

  public async transaction<T>(callback: () => Promise<T> | T): Promise<T> {
    if (this.isPostgres && this.pgPool) {
      const client = await this.pgPool.connect();
      try {
        await client.query('BEGIN');
        const result = await pgTxStorage.run(client, async () => {
          return await callback();
        });
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    } else if (this.sqliteDb) {
      this.sqliteDb.exec('BEGIN IMMEDIATE');
      try {
        const result = await callback();
        this.sqliteDb.exec('COMMIT');
        return result;
      } catch (e) {
        try {
          this.sqliteDb.exec('ROLLBACK');
        } catch {
          // ignore rollback error if transaction already ended
        }
        throw e;
      }
    }
    throw new Error('Database client not initialized.');
  }

  public async close(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = null;
    }
    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = null;
    }
  }
}

// Default application database instance
export const db = new DatabaseClient();
