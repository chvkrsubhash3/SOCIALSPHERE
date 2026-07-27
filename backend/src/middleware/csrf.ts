import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

// ─────────────────────────────────────────────
// ⚠️ TRAINING: CSRF Disabled
//
// Vulnerability: Cross-Site Request Forgery
// Any forged request from another origin is accepted
//
// CWE-352: Cross-Site Request Forgery (CSRF)
// CVSS: 8.8 (High)
// Lab: /lab/vulnerabilities/06-csrf
// ─────────────────────────────────────────────
export function noCSRFMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next(); // ⚠️ No CSRF protection
}

// ─────────────────────────────────────────────
// 🔒 SECURE: Double-Submit Cookie CSRF Pattern
//
// Fixes:
//   - Validates X-CSRF-Token header matches cookie value
//   - SameSite=Strict cookies
//   - Token regeneration per session
// ─────────────────────────────────────────────
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const csrfCookie = req.cookies?.['csrf-token'];
  const csrfHeader = req.headers['x-csrf-token'];

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    res.status(403).json({ error: 'CSRF token validation failed' });
    return;
  }

  next();
}

export const csrfMiddleware = config.trainingMode ? noCSRFMiddleware : csrfProtection;
