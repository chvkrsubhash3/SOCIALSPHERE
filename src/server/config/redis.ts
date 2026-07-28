import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
// Zero-Dependency In-Memory Store (Replaces External Redis)
// ─────────────────────────────────────────────

const memoryStore = new Map<string, { value: string; expires?: number }>();

export const redis = {
  async get(key: string): Promise<string | null> {
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },
  async setex(key: string, ttlSeconds: number, value: string): Promise<'OK'> {
    memoryStore.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
    return 'OK';
  },
  async del(...keys: string[]): Promise<number> {
    let count = 0;
    keys.forEach((k) => {
      if (memoryStore.delete(k)) count++;
    });
    return count;
  },
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(memoryStore.keys()).filter((k) => regex.test(k));
  },
  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const newVal = parseInt(current || '0', 10) + 1;
    const existing = memoryStore.get(key);
    memoryStore.set(key, { value: newVal.toString(), expires: existing?.expires });
    return newVal;
  },
  async expire(key: string, seconds: number): Promise<number> {
    const existing = memoryStore.get(key);
    if (existing) {
      existing.expires = Date.now() + seconds * 1000;
      return 1;
    }
    return 0;
  },
  async ttl(key: string): Promise<number> {
    const existing = memoryStore.get(key);
    if (!existing || !existing.expires) return -1;
    const remaining = Math.ceil((existing.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },
  async ping(): Promise<string> {
    return 'PONG';
  },
  multi() {
    return {
      incr: (key: string) => this,
      expire: (key: string, _s: number) => this,
      exec: async () => [[null, 1]],
    };
  },
  disconnect() {},
  on(_event: string, _fn: any) {},
};

// ─────────────────────────────────────────────
// Cache helpers
// ─────────────────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds = 300): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch {}
}

export async function deleteCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {}
}

export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {}
}

// ─────────────────────────────────────────────
// Rate Limiter helpers
// ─────────────────────────────────────────────

export async function incrementRateLimit(key: string, _window: number): Promise<number> {
  try {
    return await redis.incr(key);
  } catch {
    return 0;
  }
}

export async function getRateLimit(key: string): Promise<number> {
  try {
    const val = await redis.get(key);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}
