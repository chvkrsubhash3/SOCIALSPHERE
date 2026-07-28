import { Request, Response, NextFunction } from 'express';

export function metricsMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}

export function metricsHandler(_req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/plain');
  res.send('# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n');
}
