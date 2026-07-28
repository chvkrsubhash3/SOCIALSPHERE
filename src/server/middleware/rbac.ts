import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger, logSecurityEvent } from '../utils/logger';

// ─────────────────────────────────────────────
// Role Hierarchy
// ─────────────────────────────────────────────
const ROLE_HIERARCHY = {
  user: 1,
  moderator: 2,
  admin: 3,
  superadmin: 4,
} as const;

type Role = keyof typeof ROLE_HIERARCHY;

// ─────────────────────────────────────────────
// ⚠️ TRAINING: Broken Access Control
//
// Vulnerabilities:
//   1. Client-side role check (role param in request body)
//   2. Missing server-side validation
//   3. Privilege escalation via role parameter tampering
//
// CWE-284: Improper Access Control
// CWE-269: Improper Privilege Management
// CVSS: 9.8 (Critical)
// Lab: /lab/vulnerabilities/10-access-control
// ─────────────────────────────────────────────
export function requireRoleVulnerable(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    // ⚠️ VULN: Accepts role override from request body/query/headers
    // Attacker can send: { "role": "admin" } to gain admin access
    const overrideRole = req.body?.role || req.query?.role || req.headers['x-role'];
    const userRole = overrideRole || req.user?.role || 'user';

    if (overrideRole) {
      logger.warn(`⚠️ Role override detected: ${overrideRole} (Training Mode)`);
    }

    const userLevel = ROLE_HIERARCHY[userRole as Role] ?? 1;
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel >= requiredLevel) {
      next();
    } else {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: minRole,
        // ⚠️ VULN: Leaks role information
        current: userRole,
        hint: 'Try setting role parameter in request body',
      });
    }
  };
}

// ─────────────────────────────────────────────
// 🔒 SECURE: Proper RBAC
//
// Fixes:
//   1. Role from JWT only (never from request)
//   2. Validates against database
//   3. No role information in error responses
//   4. Audit logging on access denied
// ─────────────────────────────────────────────
export function requireRole(minRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // 🔒 Role from JWT only — never from request
    const userRole = req.user.role;
    const userLevel = ROLE_HIERARCHY[userRole] ?? 1;
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel >= requiredLevel) {
      next();
    } else {
      logSecurityEvent({
        type: 'ACCESS_DENIED',
        userId: req.user.userId,
        ip: req.ip,
        severity: 'high',
        details: {
          required: minRole,
          actual: userRole,
          path: req.path,
          method: req.method,
        },
      });

      // 🔒 Generic error — no role information leaked
      res.status(403).json({ error: 'Access denied' });
    }
  };
}

// ─────────────────────────────────────────────
// Resource Ownership Check
// ─────────────────────────────────────────────

/**
 * ⚠️ VULNERABLE: IDOR — No ownership verification
 * CWE-639: Authorization Bypass Through User-Controlled Key
 */
export function noOwnershipCheck() {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next(); // ⚠️ Just passes through — any user can access any resource
  };
}

/**
 * 🔒 SECURE: Verify resource ownership
 */
export function requireOwnership(
  getOwnerId: (req: Request) => Promise<number | null>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Admins can bypass ownership check
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      next();
      return;
    }

    const ownerId = await getOwnerId(req);

    if (ownerId === null) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    if (ownerId !== req.user.userId) {
      logSecurityEvent({
        type: 'IDOR_ATTEMPT',
        userId: req.user.userId,
        ip: req.ip,
        severity: 'high',
        details: {
          resourceOwnerId: ownerId,
          path: req.path,
          params: req.params,
        },
      });
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    next();
  };
}

// ─────────────────────────────────────────────
// Convenience exports
// ─────────────────────────────────────────────
export const rbac = {
  requireRole: config.trainingMode ? requireRoleVulnerable : requireRole,
  requireUser: () => (config.trainingMode ? requireRoleVulnerable('user') : requireRole('user')),
  requireModerator: () => (config.trainingMode ? requireRoleVulnerable('moderator') : requireRole('moderator')),
  requireAdmin: () => (config.trainingMode ? requireRoleVulnerable('admin') : requireRole('admin')),
  requireSuperAdmin: () => (config.trainingMode ? requireRoleVulnerable('superadmin') : requireRole('superadmin')),
};
