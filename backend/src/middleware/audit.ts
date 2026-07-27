import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { db } from '../config/database';

// ─────────────────────────────────────────────
// Audit Logging Middleware
// Captures every request with user context
// ─────────────────────────────────────────────
export async function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json.bind(res);
  let responseStatus: number;

  res.json = function (data: any) {
    responseStatus = res.statusCode;
    return originalJson(data);
  };

  res.on('finish', async () => {
    // Skip health checks and metrics
    if (req.path === '/health' || req.path === '/metrics') return;

    const duration = Date.now() - startTime;

    try {
      await db('audit_logs').insert({
        user_id: req.user?.userId ?? null,
        action: `${req.method} ${req.path}`,
        resource: req.path,
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
        status_code: res.statusCode,
        duration_ms: duration,
        request_body: config.trainingMode
          ? JSON.stringify(req.body)  // ⚠️ TRAINING: logs request body (may contain passwords)
          : JSON.stringify(sanitizeBody(req.body)),  // 🔒 SECURE: sanitize before logging
        created_at: new Date(),
      });
    } catch {
      // Don't break request if audit logging fails
    }
  });

  next();
}

// ─────────────────────────────────────────────
// Remove sensitive fields from audit log body
// ─────────────────────────────────────────────
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'credit_card', 'ssn', 'cvv'];

function sanitizeBody(body: Record<string, any>): Record<string, any> {
  if (!body || typeof body !== 'object') return body;

  const sanitized = { ...body };
  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  return sanitized;
}
