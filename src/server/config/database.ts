import knex, { Knex } from 'knex';
import { config } from './env';
import { logger } from '../utils/logger';

const isCloudPg = process.env.DB_SSL === 'true' ||
  config.databaseUrl.includes('sslmode=require') ||
  config.databaseUrl.includes('neon.tech') ||
  config.databaseUrl.includes('supabase.co') ||
  config.databaseUrl.includes('supabase.com');

const dbConnectionConfig = isCloudPg
  ? {
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
    }
  : config.databaseUrl;

export const db: Knex = knex({
  client: 'pg',
  connection: dbConnectionConfig,
  pool: {
    min: 2,
    max: 20,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
  },
  migrations: {
    directory: './database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './database/seeds',
  },
  debug: config.isDevelopment,
  log: {
    warn: (msg) => logger.warn(msg),
    error: (msg) => logger.error(msg),
    deprecate: (msg) => logger.warn(msg),
    debug: (msg) => logger.debug(msg),
  },
});

export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (err) {
    logger.error('Database connection failed:', err);
    return false;
  }
}

// ─────────────────────────────────────────────
// Query helpers (used by vulnerability labs)
// ─────────────────────────────────────────────

/**
 * ⚠️ VULNERABLE: Raw query — SQL Injection possible
 * Used in training mode for SQL injection labs
 */
export function rawQuery(query: string, params?: any[]) {
  return db.raw(query, params);
}

/**
 * 🔒 SECURE: Parameterized query via Knex query builder
 */
export function secureQuery(table: string) {
  return db(table);
}
