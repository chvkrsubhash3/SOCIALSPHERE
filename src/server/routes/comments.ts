import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ comments: [] });
});

export default router;
