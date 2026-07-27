import { config } from '../config/env';

export function modeMiddleware(req: any, res: any, next: any) {
  res.setHeader('X-Training-Mode', config.trainingMode ? 'true' : 'false');
  next();
}
