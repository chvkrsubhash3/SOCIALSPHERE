import { Router } from 'express';

const router = Router();

router.all('/', (_req, res) => {
  res.json({ data: {} });
});

export default router;
