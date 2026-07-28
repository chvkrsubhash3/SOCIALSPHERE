import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { rbac } from '../middleware/rbac';

const router = Router();

// All routes require admin role
router.use(rbac.requireAdmin());

// Dashboard stats
router.get('/stats', async (_req: Request, res: Response) => {
  const [userCount, postCount, reportCount, auditCount] = await Promise.all([
    db('users').count('* as count').first(),
    db('posts').count('* as count').first(),
    db('notifications').where({ type: 'system' }).count('* as count').first(),
    db('audit_logs').count('* as count').first(),
  ]);

  res.json({
    users: parseInt(userCount?.count as string),
    posts: parseInt(postCount?.count as string),
    reports: parseInt(reportCount?.count as string),
    auditLogs: parseInt(auditCount?.count as string),
  });
});

// User management
router.get('/users', async (req: Request, res: Response) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = db('users').select(
    'id', 'username', 'email', 'display_name', 'role',
    'is_active', 'is_verified', 'created_at', 'last_login_at'
  );

  if (search) {
    query = query.where((b) =>
      b.whereILike('username', `%${search}%`)
       .orWhereILike('email', `%${search}%`)
    );
  }

  const [users, total] = await Promise.all([
    query.orderBy('created_at', 'desc').limit(parseInt(limit as string)).offset(offset),
    db('users').count('* as count').first(),
  ]);

  res.json({ users, total: parseInt(total?.count as string), page, limit });
});

// Ban user
router.put('/users/:userId/ban', async (req: Request, res: Response) => {
  const { userId } = req.params;
  await db('users').where({ id: userId }).update({ is_active: false });
  res.json({ message: 'User banned' });
});

// Audit logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const logs = await db('audit_logs')
    .leftJoin('users', 'audit_logs.user_id', 'users.id')
    .select(
      'audit_logs.*',
      'users.username'
    )
    .orderBy('audit_logs.created_at', 'desc')
    .limit(parseInt(limit as string))
    .offset(offset);

  res.json({ logs });
});

// Security events
router.get('/security-events', async (req: Request, res: Response) => {
  const events = await db('security_events')
    .leftJoin('users', 'security_events.user_id', 'users.id')
    .select('security_events.*', 'users.username')
    .orderBy('security_events.created_at', 'desc')
    .limit(100);

  res.json({ events });
});

export default router;
