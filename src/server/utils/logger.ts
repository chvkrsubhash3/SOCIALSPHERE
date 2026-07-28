import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, errors, json, colorize, simple, printf } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) log += `\n${stack}`;
  if (Object.keys(meta).length) log += ` ${JSON.stringify(meta)}`;
  return log;
});

export const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: {
    service: 'socialsphere-api',
    mode: config.trainingMode ? 'training' : 'secure',
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'HH:mm:ss' }),
        consoleFormat
      ),
    }),
    // File transport — all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5 * 1024 * 1024,  // 5MB
      maxFiles: 5,
    }),
    // File transport — errors only
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    // Security audit log
    new winston.transports.File({
      filename: 'logs/security.log',
      level: 'warn',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

// ─── Security event logging ───
export function logSecurityEvent(event: {
  type: string;
  userId?: string | number;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}) {
  logger.warn('SECURITY_EVENT', {
    ...event,
    timestamp: new Date().toISOString(),
  });
}

// ─── Audit logging ───
export function logAudit(event: {
  action: string;
  userId?: string | number;
  resource?: string;
  resourceId?: string | number;
  ip?: string;
  result: 'success' | 'failure' | 'blocked';
  details?: Record<string, any>;
}) {
  logger.info('AUDIT', {
    ...event,
    timestamp: new Date().toISOString(),
  });
}
