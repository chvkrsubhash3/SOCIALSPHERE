import { Router, Request, Response } from 'express';
import { db, rawQuery } from '../config/database';
import { config } from '../config/env';

const router = Router();

// Get conversations
router.get('/', async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const conversations = await db.raw(`
    SELECT DISTINCT ON (other_user)
      CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user,
      content, created_at
    FROM messages
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY other_user, created_at DESC
  `, [userId, userId, userId]);

  res.json({ conversations: conversations.rows });
});

// Get messages with a user
// ⚠️ VULN #9: IDOR — Can read any user's messages by changing userId param
router.get('/:userId', async (req: Request, res: Response) => {
  const currentUserId = req.user!.userId;
  const otherUserId = req.params.userId;

  if (config.trainingMode) {
    // ⚠️ VULN: No ownership check — can read any conversation
    const messages = await db('messages')
      .where((b) => b
        .where({ sender_id: otherUserId, receiver_id: otherUserId })
        .orWhere({ sender_id: currentUserId, receiver_id: parseInt(otherUserId) })
        .orWhere({ sender_id: parseInt(otherUserId), receiver_id: currentUserId })
      )
      .orderBy('created_at', 'asc')
      .limit(100);
    res.json({ messages });
  } else {
    // 🔒 SECURE: Only show messages where current user is sender or receiver
    const messages = await db('messages')
      .where((b) => b
        .where({ sender_id: currentUserId, receiver_id: parseInt(otherUserId) })
        .orWhere({ sender_id: parseInt(otherUserId), receiver_id: currentUserId })
      )
      .orderBy('created_at', 'asc')
      .limit(100);
    res.json({ messages });
  }
});

// Send message
router.post('/:userId', async (req: Request, res: Response) => {
  const senderId = req.user!.userId;
  const receiverId = parseInt(req.params.userId);
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: 'Message content required' });
    return;
  }

  let processedContent = content;
  if (!config.trainingMode) {
    const sanitizeHtml = require('sanitize-html');
    processedContent = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} });
  }

  const [message] = await db('messages').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    content: processedContent,
    created_at: new Date(),
  }).returning('*');

  res.status(201).json({ message });
});

export default router;
