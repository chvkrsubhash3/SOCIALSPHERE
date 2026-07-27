import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger, logSecurityEvent, logAudit } from '../utils/logger';

// ─────────────────────────────────────────────
// Error Handler Middleware
//
// ⚠️ TRAINING: Exposes stack traces, internal errors
// 🔒 SECURE: Generic error messages, structured logging
// ─────────────────────────────────────────────
export function errorHandler(
  err: Error & { status?: number; code?: string },
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const status = err.status ?? 500;

  // Always log internally
  logger.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.userId,
    ip: req.ip,
  });

  // Log security event for server errors
  if (status >= 500) {
    logSecurityEvent({
      type: 'UNHANDLED_ERROR',
      severity: 'high',
      ip: req.ip,
      userId: req.user?.userId?.toString(),
      details: { path: req.path, error: err.message },
    });
  }

  if (config.trainingMode && config.security.showStackTraces) {
    // ⚠️ TRAINING: Full error disclosure
    res.status(status).json({
      error: err.message,
      stack: err.stack,
      code: err.code,
      // ⚠️ Leaks internal paths and version info
      path: req.path,
      timestamp: new Date().toISOString(),
      server: 'SocialSphere/1.0.0',
      nodeVersion: process.version,
      // ⚠️ Leaks DB queries in error
      dbQuery: (err as any).query,
      hint: 'Check /api-docs for valid endpoints',
    });
  } else {
    // 🔒 SECURE: Generic error message only
    res.status(status).json({
      error: status === 500
        ? 'An unexpected error occurred'
        : err.message,
    });
  }
}

export function modeMiddleware(req: Request, res: Response, next: NextFunction) {
  // Attach mode to response for client-side awareness
  res.setHeader('X-Training-Mode', config.trainingMode ? 'true' : 'false');
  next();
}
