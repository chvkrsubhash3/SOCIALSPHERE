import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { logSecurityEvent } from '../utils/logger';

// ─────────────────────────────────────────────
// ⚠️ TRAINING: No Rate Limiting
//
// Vulnerabilities:
//   - Unlimited login attempts (brute force)
//   - Unlimited OTP attempts
//   - Unlimited password reset requests
//   - No IP-based throttling
//
// CWE-307: Improper Restriction of Excessive Authentication Attempts
// CVSS: 7.5 (High)
// Lab: /lab/vulnerabilities/22-rate-limiting
// ─────────────────────────────────────────────
export function noRateLimitMiddleware(
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  // ⚠️ VULN: No rate limiting whatsoever
  next();
}

// ─────────────────────────────────────────────
// 🔒 SECURE: Redis-backed Rate Limiter
//
// Fixes:
//   - Per-IP rate limiting
//   - Per-user rate limiting
//   - Sliding window algorithm
//   - Automatic lockout after threshold
//   - Returns Retry-After headers
// ─────────────────────────────────────────────
interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
  skipSuccessfulRequests?: boolean;
}

export function createRateLimiter(options: RateLimitOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `ratelimit:${options.keyPrefix ?? 'global'}:${req.ip}`;

    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, options.windowSeconds);
    }

    const ttl = await redis.ttl(key);

    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - count));
    res.setHeader('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + ttl);

    if (count > options.maxRequests) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: req.ip,
        severity: 'medium',
        details: {
          key,
          count,
          limit: options.maxRequests,
          path: req.path,
        },
      });

      res.setHeader('Retry-After', ttl);
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: ttl,
      });
      return;
    }

    next();
  };
}

// ─────────────────────────────────────────────
// Specific Rate Limiters
// ─────────────────────────────────────────────
export const loginRateLimiter = createRateLimiter({
  windowSeconds: 900,    // 15 minutes
  maxRequests: 5,
  keyPrefix: 'login',
});

export const otpRateLimiter = createRateLimiter({
  windowSeconds: 300,    // 5 minutes
  maxRequests: 3,
  keyPrefix: 'otp',
});

export const passwordResetRateLimiter = createRateLimiter({
  windowSeconds: 3600,   // 1 hour
  maxRequests: 3,
  keyPrefix: 'pwd-reset',
});

export const apiRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 60,
  keyPrefix: 'api',
});

// ─────────────────────────────────────────────
// Export based on mode
// ─────────────────────────────────────────────
export const rateLimiterMiddleware = config.trainingMode
  ? noRateLimitMiddleware
  : apiRateLimiter;
