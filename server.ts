import express from 'express';
import next from 'next';
import app from './src/server/app';
import { logger } from './src/server/utils/logger';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOST || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  // Delegate all non-API / Next.js requests to Next App Handler
  app.all('*', (req, res) => {
    return handle(req, res);
  });

  app.listen(port, () => {
    logger.info(`
╔══════════════════════════════════════════════════════╗
║      SocialSphere Unified Application Started        ║
╠══════════════════════════════════════════════════════╣
║  URL   : http://localhost:${port}                       ║
║  API   : http://localhost:${port}/api                   ║
║  Docs  : http://localhost:${port}/api-docs              ║
║  Health: http://localhost:${port}/health                ║
╚══════════════════════════════════════════════════════╝
    `);
  });
}).catch((err) => {
  logger.error('Failed to start unified server:', err);
  process.exit(1);
});
