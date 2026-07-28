import 'express-async-errors';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { config } from './config/env';
import { db } from './config/database';
import { redis } from './config/redis';
import { logger } from './utils/logger';
import { metricsMiddleware, metricsHandler } from './config/metrics';

// ─── Middleware ───
import { modeMiddleware } from './middleware/mode';
import { authMiddleware } from './middleware/auth';
import { rateLimiterMiddleware } from './middleware/rateLimiter';
import { securityHeadersMiddleware } from './middleware/headers';
import { csrfMiddleware } from './middleware/csrf';
import { auditMiddleware } from './middleware/audit';
import { errorHandler } from './middleware/errorHandler';
import { corsMiddleware } from './middleware/cors';

// ─── Routes ───
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import postsRoutes from './routes/posts';
import commentsRoutes from './routes/comments';
import likesRoutes from './routes/likes';
import followRoutes from './routes/follow';
import messagesRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import marketplaceRoutes from './routes/marketplace';
import communitiesRoutes from './routes/communities';
import searchRoutes from './routes/search';
import storiesRoutes from './routes/stories';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import moderatorRoutes from './routes/moderator';
import webhookRoutes from './routes/webhooks';
import graphqlRoutes from './routes/graphql';
import labRoutes from './routes/lab';

// ─── Socket.IO Handlers ───
import { setupSocketHandlers } from './services/socketService';

const app: Application = express();
const httpServer = createServer(app);

// ─────────────────────────────────────────────
// Socket.IO — Real-time features
// ─────────────────────────────────────────────
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/ws',
});

setupSocketHandlers(io);

// ─────────────────────────────────────────────
// Core Middleware
// ─────────────────────────────────────────────

// Prometheus metrics
app.use(metricsMiddleware);

// Mode indicator — injects training/secure context
app.use(modeMiddleware);

// Logging
app.use(morgan(config.isProduction ? 'combined' : 'dev', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ─── CORS ───
// ⚠️ TRAINING: Allow all origins
// 🔒 SECURE: Restrict to configured origins
app.use(corsMiddleware);

// ─── Security Headers ───
// ⚠️ TRAINING: Minimal headers
// 🔒 SECURE: Full Helmet suite
app.use(securityHeadersMiddleware);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser(config.sessionSecret));

// CSRF Protection
// ⚠️ TRAINING: Disabled
// 🔒 SECURE: Enabled with SameSite
app.use(csrfMiddleware);

// Rate Limiting
// ⚠️ TRAINING: Disabled
// 🔒 SECURE: Redis-backed rate limiter
app.use(rateLimiterMiddleware);

// Audit logging
app.use(auditMiddleware);

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────
const API = '/api' as const;

app.get('/', (_req, res) => {
  res.json({
    name: 'SocialSphere API',
    version: '1.0.0',
    mode: config.trainingMode ? 'training' : 'secure',
    docs: '/api-docs',
  });
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    let redisConnected = false;
    try {
      await redis.ping();
      redisConnected = true;
    } catch {
      // Redis is optional
    }
    res.json({
      status: 'healthy',
      database: 'connected',
      redis: redisConnected ? 'connected' : 'offline',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: (err as Error).message });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', metricsHandler);

// ─── API Routes ───
app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, authMiddleware, usersRoutes);
app.use(`${API}/posts`, authMiddleware, postsRoutes);
app.use(`${API}/comments`, authMiddleware, commentsRoutes);
app.use(`${API}/likes`, authMiddleware, likesRoutes);
app.use(`${API}/follow`, authMiddleware, followRoutes);
app.use(`${API}/messages`, authMiddleware, messagesRoutes);
app.use(`${API}/notifications`, authMiddleware, notificationsRoutes);
app.use(`${API}/marketplace`, authMiddleware, marketplaceRoutes);
app.use(`${API}/communities`, authMiddleware, communitiesRoutes);
app.use(`${API}/search`, authMiddleware, searchRoutes);
app.use(`${API}/stories`, authMiddleware, storiesRoutes);
app.use(`${API}/upload`, authMiddleware, uploadRoutes);
app.use(`${API}/admin`, authMiddleware, adminRoutes);
app.use(`${API}/moderator`, authMiddleware, moderatorRoutes);
app.use(`${API}/webhooks`, webhookRoutes);
app.use(`${API}/graphql`, graphqlRoutes);
app.use(`${API}/lab`, labRoutes);

// ─────────────────────────────────────────────
// Swagger / API Docs
// ─────────────────────────────────────────────
if (!config.isProduction) {
  const swaggerUi = require('swagger-ui-express');
  const swaggerDoc = require('./docs/swagger.json');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
}

// ─────────────────────────────────────────────
// ⚠️ TRAINING: Verbose stack traces in errors
// 🔒 SECURE: Generic error messages
// ─────────────────────────────────────────────

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    path: _req.path,
    // ⚠️ Training: exposes path info
    ...(config.trainingMode && { availableRoutes: '/api-docs' }),
  });
});

// Global error handler
app.use(errorHandler);

// ─────────────────────────────────────────────
// Server Startup
// ─────────────────────────────────────────────
async function bootstrap() {
  try {
    // Test DB connection
    await db.raw('SELECT 1');
    logger.info('✅ PostgreSQL connected');

    // Test Redis connection (Optional)
    try {
      await redis.ping();
      logger.info('✅ Redis connected');
    } catch {
      logger.warn('⚠️ Redis not available — caching & rate limiting disabled');
    }

    httpServer.listen(config.port, config.host, () => {
      logger.info(`
╔══════════════════════════════════════════════════════╗
║          SocialSphere API Server Started             ║
╠══════════════════════════════════════════════════════╣
║  Mode  : ${config.trainingMode ? '⚠️  TRAINING (Vulnerable)          ' : '🔒 SECURE (Hardened)              '}║
║  URL   : http://${config.host}:${config.port}                   ║
║  Docs  : http://${config.host}:${config.port}/api-docs          ║
║  Health: http://${config.host}:${config.port}/health            ║
╚══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await db.destroy();
  redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await db.destroy();
  redis.disconnect();
  process.exit(0);
});

if (require.main === module && !process.env.VERCEL) {
  bootstrap();
}

export default app;
export { app, httpServer, io };
