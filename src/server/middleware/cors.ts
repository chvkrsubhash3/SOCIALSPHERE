import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from '../config/env';
import { logSecurityEvent } from '../utils/logger';

// ─────────────────────────────────────────────
// ⚠️ TRAINING: CORS Misconfiguration
//
// Vulnerabilities:
//   1. Allow ALL origins (wildcard)
//   2. Allow credentials with wildcard origin
//   3. Reflect arbitrary Origin header
//   4. Allow all methods including TRACE
//
// CWE-942: Permissive Cross-domain Policy with Untrusted Domains
// CVSS: 8.1 (High)
// Lab: /lab/vulnerabilities/17-cors
// ─────────────────────────────────────────────
export const vulnerableCorsMiddleware = cors({
  // ⚠️ VULN #1: Reflect any origin back (ACAO: <attacker-origin>)
  origin: (origin, callback) => {
    // Reflects whatever origin the browser sends
    callback(null, origin || '*');
  },

  // ⚠️ VULN #2: Allow credentials with reflected origin (bypasses browser protection)
  credentials: true,

  // ⚠️ VULN #3: Allow all methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'TRACE', 'CONNECT'],

  // ⚠️ VULN #4: Allow any header
  allowedHeaders: '*',

  // ⚠️ VULN #5: Expose sensitive headers
  exposedHeaders: ['Authorization', 'X-Total-Count', 'X-User-Id', 'X-Role'],

  optionsSuccessStatus: 200,
});

// ─────────────────────────────────────────────
// 🔒 SECURE: Strict CORS Policy
//
// Fixes:
//   1. Explicit allowlist of trusted origins
//   2. No credentials with wildcard origin
//   3. Restricted methods
//   4. Limited exposed headers
//   5. Logs blocked origins
// ─────────────────────────────────────────────
export const secureCorsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman)
    if (!origin) {
      callback(null, false);
      return;
    }

    if (config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logSecurityEvent({
        type: 'CORS_BLOCKED',
        severity: 'medium',
        details: { origin, allowed: config.corsOrigins },
      });
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
});

// ─────────────────────────────────────────────
// Export based on mode
// ─────────────────────────────────────────────
export const corsMiddleware = config.trainingMode
  ? vulnerableCorsMiddleware
  : secureCorsMiddleware;
