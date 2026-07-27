import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) {
      logger.error('Redis connection failed after 3 retries');
      return null;
    }
    return Math.min(times * 50, 2000);
  },
  reconnectOnError: (err) => {
    logger.warn('Redis reconnecting after error:', err.message);
    return true;
  },
});

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));
redis.on('close', () => logger.warn('Redis connection closed'));

// ─────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function deleteCache(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

// ─────────────────────────────────────────────
// Rate Limiter helpers
// ─────────────────────────────────────────────

export async function incrementRateLimit(key: string, window: number): Promise<number> {
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, window);
  const results = await multi.exec();
  return (results?.[0]?.[1] as number) ?? 0;
}

export async function getRateLimit(key: string): Promise<number> {
  const val = await redis.get(key);
  return val ? parseInt(val) : 0;
}
