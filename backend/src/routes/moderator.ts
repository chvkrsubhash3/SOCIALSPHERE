import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { rbac } from '../middleware/rbac';

const router = Router();
router.use(rbac.requireModerator());

router.get('/reported-posts', async (_req: Request, res: Response) => {
  const posts = await db('posts')
    .join('users', 'posts.user_id', 'users.id')
    .select('posts.*', 'users.username')
    .orderBy('posts.created_at', 'desc')
    .limit(50);
  res.json({ posts });
});

router.delete('/posts/:postId', async (req: Request, res: Response) => {
  await db('posts').where({ id: req.params.postId }).delete();
  res.json({ message: 'Post removed by moderator' });
});

export default router;
