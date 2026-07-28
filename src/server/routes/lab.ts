import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { config } from '../config/env';
import { logSecurityEvent } from '../utils/logger';

// ─────────────────────────────────────────────
// Lab / CTF Routes
// ─────────────────────────────────────────────
const router = Router();

// Get all vulnerabilities
router.get('/vulnerabilities', (_req: Request, res: Response) => {
  res.json({
    total: 50,
    categories: [
      { id: 'injection', name: 'Injection', count: 6 },
      { id: 'xss', name: 'Cross-Site Scripting', count: 3 },
      { id: 'auth', name: 'Authentication', count: 8 },
      { id: 'access', name: 'Access Control', count: 5 },
      { id: 'server', name: 'Server-Side', count: 8 },
    ],
    mode: config.trainingMode ? 'training' : 'secure',
  });
});

// Submit flag
router.post('/submit-flag', async (req: Request, res: Response) => {
  const { flag } = req.body;
  const userId = req.user?.userId;

  if (!flag) {
    res.status(400).json({ error: 'Flag required' });
    return;
  }

  const ctfFlag = await db('ctf_flags').where({ flag: flag.trim() }).first();

  if (!ctfFlag) {
    logSecurityEvent({
      type: 'WRONG_FLAG_SUBMITTED',
      userId: userId?.toString(),
      ip: req.ip,
      severity: 'low',
      details: { flag: flag.trim().substring(0, 20) },
    });
    res.json({ correct: false, message: 'Incorrect flag. Keep trying!' });
    return;
  }

  // Check if already submitted
  if (userId) {
    const existing = await db('ctf_submissions')
      .where({ user_id: userId, flag_id: ctfFlag.id, is_correct: true })
      .first();

    if (existing) {
      res.json({
        correct: true,
        alreadySolved: true,
        vuln: ctfFlag.vulnerability_name,
        points: 0,
      });
      return;
    }

    await db('ctf_submissions').insert({
      user_id: userId,
      flag_id: ctfFlag.id,
      is_correct: true,
      submitted_flag: flag.trim(),
      created_at: new Date(),
    });
  }

  res.json({
    correct: true,
    message: `🎉 Correct! You found: ${ctfFlag.vulnerability_name}`,
    vuln: ctfFlag.vulnerability_name,
    difficulty: ctfFlag.difficulty,
    points: ctfFlag.points,
    description: ctfFlag.description,
  });
});

// Get leaderboard
router.get('/leaderboard', async (_req: Request, res: Response) => {
  const leaderboard = await db('ctf_submissions')
    .join('users', 'ctf_submissions.user_id', 'users.id')
    .join('ctf_flags', 'ctf_submissions.flag_id', 'ctf_flags.id')
    .select(
      'users.username',
      'users.display_name',
      'users.avatar_url',
      db.raw('SUM(ctf_flags.points) as total_points'),
      db.raw('COUNT(DISTINCT ctf_submissions.flag_id) as flags_found')
    )
    .where('ctf_submissions.is_correct', true)
    .groupBy('users.id', 'users.username', 'users.display_name', 'users.avatar_url')
    .orderBy('total_points', 'desc')
    .limit(10);

  res.json({ leaderboard });
});

// Get hints for a vulnerability
router.get('/hints/:vulnId', (req: Request, res: Response) => {
  if (!config.showHints && !config.trainingMode) {
    res.status(403).json({ error: 'Hints disabled in secure mode' });
    return;
  }

  res.json({
    vulnId: req.params.vulnId,
    hints: [
      'Check the network tab in DevTools',
      'Look at the error messages carefully',
      'Try common injection characters: \' " ; --',
    ],
  });
});

export default router;
