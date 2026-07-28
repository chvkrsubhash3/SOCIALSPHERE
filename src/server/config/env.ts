import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const config = {
  // ─── Mode ───
  trainingMode: optional('TRAINING_MODE', 'true') === 'true',
  isProduction: optional('NODE_ENV', 'development') === 'production',
  isDevelopment: optional('NODE_ENV', 'development') === 'development',
  nodeEnv: optional('NODE_ENV', 'development'),

  // ─── Server ───
  port: parseInt(optional('PORT', '4000')),
  host: optional('HOST', '0.0.0.0'),

  // ─── Database ───
  databaseUrl: optional('DATABASE_URL', 'postgresql://socialsphere:socialsphere@localhost:5432/socialsphere'),

  // ─── Redis ───
  redisUrl: optional('REDIS_URL', 'redis://localhost:6379'),
  redisHost: optional('REDIS_HOST', 'localhost'),
  redisPort: parseInt(optional('REDIS_PORT', '6379')),
  redisPassword: optional('REDIS_PASSWORD', ''),

  // ─── MinIO ───
  minio: {
    endpoint: optional('MINIO_ENDPOINT', 'localhost'),
    port: parseInt(optional('MINIO_PORT', '9000')),
    useSSL: optional('MINIO_USE_SSL', 'false') === 'true',
    accessKey: optional('MINIO_ACCESS_KEY', 'minioadmin'),
    secretKey: optional('MINIO_SECRET_KEY', 'minioadmin'),
    bucket: optional('MINIO_BUCKET', 'socialsphere'),
  },

  // ─── JWT ───
  jwtSecret: optional('JWT_SECRET', 'super_weak_secret_for_training_do_not_use_in_production'),
  jwtRefreshSecret: optional('JWT_REFRESH_SECRET', 'another_weak_secret_training_only'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
  // ⚠️ TRAINING: 'HS256' — allows "none" algorithm bypass in vuln lab
  // 🔒 SECURE: Always 'HS256', verify alg strictly
  jwtAlgorithm: optional('JWT_ALGORITHM', 'HS256'),

  // ─── Session ───
  sessionSecret: optional('SESSION_SECRET', 'weak_session_secret_training_only'),
  sessionName: optional('SESSION_NAME', 'ss_session'),

  // ─── OAuth ───
  oauth: {
    googleClientId: optional('OAUTH_GOOGLE_CLIENT_ID', ''),
    googleClientSecret: optional('OAUTH_GOOGLE_CLIENT_SECRET', ''),
    callbackUrl: optional('OAUTH_CALLBACK_URL', 'http://localhost/api/auth/oauth/google/callback'),
  },

  // ─── Email ───
  smtp: {
    host: optional('SMTP_HOST', 'localhost'),
    port: parseInt(optional('SMTP_PORT', '1025')),
    secure: optional('SMTP_SECURE', 'false') === 'true',
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('SMTP_FROM', 'noreply@socialsphere.local'),
  },

  // ─── LDAP ───
  ldap: {
    url: optional('LDAP_URL', 'ldap://localhost:389'),
    baseDn: optional('LDAP_BASE_DN', 'dc=socialsphere,dc=local'),
    bindDn: optional('LDAP_BIND_DN', 'cn=admin,dc=socialsphere,dc=local'),
    bindPassword: optional('LDAP_BIND_PASSWORD', 'adminpassword'),
  },

  // ─── Security Settings ───
  security: {
    bcryptRounds: parseInt(optional('BCRYPT_ROUNDS', '12')),
    disableRateLimit: optional('DISABLE_RATE_LIMIT', 'false') === 'true',
    rateLimitWindowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000')),
    rateLimitMax: parseInt(optional('RATE_LIMIT_MAX', '100')),
    allowAllCors: optional('ALLOW_ALL_CORS', 'false') === 'true',
    disableCsrf: optional('DISABLE_CSRF', 'false') === 'true',
    showStackTraces: optional('SHOW_STACK_TRACES', 'false') === 'true',
    disableSecurityHeaders: optional('DISABLE_SECURITY_HEADERS', 'false') === 'true',
    disableCsp: optional('DISABLE_CSP', 'false') === 'true',
    cookieSecure: optional('COOKIE_SECURE', 'true') === 'true',
    cookieHttpOnly: optional('COOKIE_HTTP_ONLY', 'true') === 'true',
    cookieSameSite: optional('COOKIE_SAME_SITE', 'strict') as 'strict' | 'lax' | 'none',
  },

  // ─── CORS ───
  corsOrigins: optional('CORS_ORIGINS', 'http://localhost,http://localhost:3000').split(','),

  // ─── Monitoring ───
  prometheusEnabled: optional('PROMETHEUS_ENABLED', 'true') === 'true',

  // ─── CTF / Lab ───
  ctfMode: optional('CTF_MODE', 'true') === 'true',
  ctfSecret: optional('CTF_SECRET', 'socialsphere_ctf_2024'),
  showHints: optional('SHOW_HINTS', 'true') === 'true',

  // ─── Admin ───
  adminEmail: optional('ADMIN_EMAIL', 'admin@socialsphere.local'),
  adminPassword: optional('ADMIN_PASSWORD', 'Admin@123!'),
};

// Validate critical config in production
if (config.isProduction) {
  if (config.jwtSecret === 'super_weak_secret_for_training_do_not_use_in_production') {
    throw new Error('🚨 SECURITY: JWT_SECRET must be changed in production!');
  }
  if (config.trainingMode) {
    throw new Error('🚨 SECURITY: TRAINING_MODE must be false in production!');
  }
}
