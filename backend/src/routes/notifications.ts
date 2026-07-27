import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const notifications = await db('notifications')
    .leftJoin('users', 'notifications.actor_id', 'users.id')
    .select('notifications.*', 'users.username', 'users.avatar_url')
    .where('notifications.user_id', userId)
    .orderBy('notifications.created_at', 'desc')
    .limit(50);
  res.json({ notifications });
});

router.put('/:id/read', async (req: Request, res: Response) => {
  await db('notifications')
    .where({ id: req.params.id, user_id: req.user!.userId })
    .update({ read_at: new Date() });
  res.json({ message: 'Marked as read' });
});

router.put('/read-all', async (req: Request, res: Response) => {
  await db('notifications')
    .where({ user_id: req.user!.userId })
    .whereNull('read_at')
    .update({ read_at: new Date() });
  res.json({ message: 'All marked as read' });
});

export default router;
