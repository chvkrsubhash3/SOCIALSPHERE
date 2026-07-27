import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import helmet from 'helmet';

// ─────────────────────────────────────────────
// ⚠️ TRAINING: Missing Security Headers
//
// Vulnerabilities:
//   - No X-Frame-Options (Clickjacking)
//   - No X-Content-Type-Options (MIME sniffing)
//   - No Strict-Transport-Security
//   - No Referrer-Policy
//   - No Permissions-Policy
//   - Server header exposes version
//
// CWE-693: Protection Mechanism Failure
// CVSS: 5.3 (Medium)
// Lab: /lab/vulnerabilities/45-missing-headers
// ─────────────────────────────────────────────
export function vulnerableHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // ⚠️ VULN: Expose server technology
  res.setHeader('X-Powered-By', 'Express/4.18.2 Node.js/20.0.0');
  res.setHeader('Server', 'SocialSphere/1.0.0 Ubuntu 22.04');

  // ⚠️ VULN: No X-Frame-Options — Clickjacking possible
  // ⚠️ VULN: No X-Content-Type-Options — MIME sniffing
  // ⚠️ VULN: No X-XSS-Protection
  // ⚠️ VULN: No HSTS
  // ⚠️ VULN: No CSP

  next();
}

// ─────────────────────────────────────────────
// 🔒 SECURE: Full Security Headers via Helmet
//
// Fixes:
//   - X-Frame-Options: DENY (Clickjacking protection)
//   - X-Content-Type-Options: nosniff
//   - Strict-Transport-Security
//   - Referrer-Policy: strict-origin-when-cross-origin
//   - Content-Security-Policy
//   - Permissions-Policy
//   - Remove X-Powered-By
//
// CWE-693: Protection Mechanism Failure
// ─────────────────────────────────────────────
export const secureHeadersMiddleware = helmet({
  // X-Frame-Options: DENY
  frameguard: { action: 'deny' },

  // X-Content-Type-Options: nosniff
  noSniff: true,

  // Strict-Transport-Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },

  // Referrer-Policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // Content-Security-Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },

  // Remove X-Powered-By
  hidePoweredBy: true,

  // X-XSS-Protection (legacy but still useful)
  xssFilter: true,
});

// ─────────────────────────────────────────────
// Export based on mode
// ─────────────────────────────────────────────
export const securityHeadersMiddleware = config.trainingMode
  ? vulnerableHeadersMiddleware
  : secureHeadersMiddleware;
