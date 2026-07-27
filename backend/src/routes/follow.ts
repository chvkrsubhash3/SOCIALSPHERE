import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

router.post('/:userId', async (req: Request, res: Response) => {
  const followerId = req.user!.userId;
  const followingId = parseInt(req.params.userId);

  await db('follows').insert({
    follower_id: followerId,
    following_id: followingId,
    created_at: new Date(),
  }).onConflict(['follower_id', 'following_id']).ignore();

  res.json({ message: 'Following' });
});

router.delete('/:userId', async (req: Request, res: Response) => {
  const followerId = req.user!.userId;
  const followingId = parseInt(req.params.userId);

  await db('follows')
    .where({ follower_id: followerId, following_id: followingId })
    .delete();

  res.json({ message: 'Unfollowed' });
});

export default router;
