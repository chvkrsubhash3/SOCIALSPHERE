import { Router, Request, Response } from 'express';
const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ likes: [] });
});

router.post('/:postId', async (req: Request, res: Response) => {
  res.json({ message: 'Liked' });
});

export default router;
