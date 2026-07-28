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
// Cache helpers (Safe when Redis is offline)
// ─────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch (err) {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    // Ignore cache set failures when Redis is offline
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    // Ignore cache delete failures when Redis is offline
  }
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    // Ignore cache invalidation failures when Redis is offline
  }
}

// ─────────────────────────────────────────────
// Rate Limiter helpers
// ─────────────────────────────────────────────

export async function incrementRateLimit(key: string, window: number): Promise<number> {
  try {
    const multi = redis.multi();
    multi.incr(key);
    multi.expire(key, window);
    const results = await multi.exec();
    return (results?.[0]?.[1] as number) ?? 0;
  } catch (err) {
    return 0;
  }
}

export async function getRateLimit(key: string): Promise<number> {
  try {
    const val = await redis.get(key);
    return val ? parseInt(val) : 0;
  } catch (err) {
    return 0;
  }
}
