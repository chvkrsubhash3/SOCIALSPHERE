import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { logger, logSecurityEvent } from '../utils/logger';

// ─────────────────────────────────────────────
// JWT Token Types
// ─────────────────────────────────────────────
export interface TokenPayload {
  userId: number;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin' | 'superadmin';
  iat?: number;
  exp?: number;
}

// ─────────────────────────────────────────────
// ⚠️ TRAINING: Vulnerable JWT Verification
//
// Vulnerabilities:
//   1. Accepts "alg: none" — JWT None Algorithm Attack (CWE-347)
//   2. Accepts expired tokens if IGNORE_EXPIRY=true
//   3. Weak secret (configurable via env)
//   4. No token blacklist (refresh token abuse)
//   5. JWT secret leaked in verbose error messages
//
// CWE-347: Improper Verification of Cryptographic Signature
// CVSS: 9.1 (Critical)
// Lab: /lab/vulnerabilities/08-jwt
// ─────────────────────────────────────────────
function verifyTokenVulnerable(token: string): TokenPayload {
  // ⚠️ VULN #1: Decodes header without verifying algorithm
  const header = JSON.parse(
    Buffer.from(token.split('.')[0], 'base64').toString('utf8')
  );

  // ⚠️ VULN #2: If algorithm is "none", skip signature verification entirely
  if (header.alg === 'none') {
    logger.warn('⚠️ JWT with algorithm "none" accepted! (Training Mode)');
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf8')
    );
    return payload;
  }

  try {
    // ⚠️ VULN #3: Expired token bypass via query param
    const ignoreExpiry = process.env.IGNORE_EXPIRY === 'true';
    return jwt.verify(token, config.jwtSecret, {
      ignoreExpiration: ignoreExpiry,
    }) as TokenPayload;
  } catch (err: any) {
    // ⚠️ VULN #4: Leaks JWT secret in error message (Information Disclosure)
    if (config.trainingMode && config.security.showStackTraces) {
      throw new Error(`JWT Verification Failed: ${err.message}. Secret hint: ${config.jwtSecret.substring(0, 8)}...`);
    }
    throw err;
  }
}

// ─────────────────────────────────────────────
// 🔒 SECURE: Hardened JWT Verification
//
// Fixes:
//   1. Strictly enforces algorithm (HS256 only)
//   2. Always validates expiry
//   3. Checks token blacklist in Redis
//   4. Generic error messages
//   5. Logs suspicious tokens
// ─────────────────────────────────────────────
async function verifyTokenSecure(token: string): Promise<TokenPayload> {
  // Check token blacklist (for logout invalidation)
  const isBlacklisted = await redis.get(`blacklist:${token}`);
  if (isBlacklisted) {
    throw new Error('Token has been revoked');
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],  // 🔒 Strict algorithm pinning
      ignoreExpiration: false,
    }) as TokenPayload;

    return payload;
  } catch (err: any) {
    // 🔒 Generic error — no information leakage
    if (err.name === 'JsonWebTokenError') {
      throw new Error('Invalid authentication token');
    }
    if (err.name === 'TokenExpiredError') {
      throw new Error('Authentication token has expired');
    }
    throw new Error('Authentication failed');
  }
}

// ─────────────────────────────────────────────
// Auth Middleware
// ─────────────────────────────────────────────
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.cookies?.access_token;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    let payload: TokenPayload;

    if (config.trainingMode) {
      // ⚠️ Training: use vulnerable verification
      payload = verifyTokenVulnerable(token);
    } else {
      // 🔒 Secure: use hardened verification
      payload = await verifyTokenSecure(token);
    }

    // Attach user to request
    req.user = payload;

    // Load fresh user from DB (verify not deleted/banned)
    const user = await db('users')
      .where({ id: payload.userId, is_active: true })
      .first('id', 'username', 'email', 'role', 'is_verified');

    if (!user) {
      res.status(401).json({ error: 'User account not found or disabled' });
      return;
    }

    req.user = { ...payload, role: user.role };
    next();
  } catch (err: any) {
    logSecurityEvent({
      type: 'INVALID_JWT',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      severity: 'medium',
      details: { error: err.message },
    });

    res.status(401).json({
      error: 'Invalid authentication token',
      // ⚠️ TRAINING: expose error details
      ...(config.security.showStackTraces && { details: err.message }),
    });
  }
}

// ─────────────────────────────────────────────
// Token Generation
// ─────────────────────────────────────────────
export function generateTokens(user: {
  id: number;
  username: string;
  email: string;
  role: string;
}) {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role as TokenPayload['role'],
  };

  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });

  const refreshToken = jwt.sign(
    { userId: user.id },
    config.jwtRefreshSecret,
    { expiresIn: config.jwtRefreshExpiresIn, algorithm: 'HS256' }
  );

  return { accessToken, refreshToken };
}

// ─────────────────────────────────────────────
// Optional Auth (public routes that benefit from user context)
// ─────────────────────────────────────────────
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.access_token;

  if (token) {
    try {
      const payload = config.trainingMode
        ? verifyTokenVulnerable(token)
        : await verifyTokenSecure(token);
      req.user = payload;
    } catch {
      // Silently ignore invalid token for optional auth
    }
  }

  next();
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
