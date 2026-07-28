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

let isInitialized = false;

export async function ensureDatabaseTables() {
  if (isInitialized) return;
  try {
    const hasUsersTable = await db.schema.hasTable('users');
    if (!hasUsersTable) {
      logger.info('📦 Initializing database schema on PostgreSQL...');
      await db.schema.createTable('users', (table) => {
        table.increments('id').primary();
        table.string('username', 50).notNullable().unique();
        table.string('email', 255).notNullable().unique();
        table.string('password_hash', 512).notNullable();
        table.string('display_name', 100);
        table.text('bio');
        table.string('avatar_url', 500);
        table.string('cover_url', 500);
        table.string('website', 200);
        table.string('location', 100);
        table.date('date_of_birth');
        table.string('phone', 20);
        table.string('role', 50).defaultTo('user');
        table.boolean('is_active').defaultTo(true);
        table.boolean('is_verified').defaultTo(false);
        table.boolean('is_private').defaultTo(false);
        table.string('verification_token', 256);
        table.string('theme', 50).defaultTo('default');
        table.text('notification_template');
        table.jsonb('privacy_settings').defaultTo('{}');
        table.string('last_login_ip', 45);
        table.timestamp('last_login_at');
        table.timestamps(true, true);
      });
      logger.info('✅ Database users table created');
    }

    const hasCoinsTable = await db.schema.hasTable('user_coins');
    if (!hasCoinsTable) {
      await db.schema.createTable('user_coins', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.decimal('balance', 20, 2).defaultTo(0);
        table.timestamps(true, true);
      });
    }

    isInitialized = true;
  } catch (err) {
    logger.warn('Database auto-initialization check:', err);
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    await ensureDatabaseTables();
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
