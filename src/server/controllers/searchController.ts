import { Request, Response } from 'express';
import sanitizeHtml from 'sanitize-html';
import xss from 'xss';
import { db, rawQuery } from '../config/database';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { logger, logSecurityEvent } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
//                    SEARCH CONTROLLER
//
// Vulnerabilities: SQL Injection, Reflected XSS, NoSQL Injection
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// SEARCH USERS
//
// ⚠️ VULN #1: SQL Injection
// ⚠️ VULN #2: Blind SQL Injection
// ⚠️ VULN #4: Reflected XSS (q param in response)
// ─────────────────────────────────────────────
export async function searchUsers(req: Request, res: Response): Promise<void> {
  const { q, limit = '20', offset = '0' } = req.query;

  if (!q) {
    res.json({ users: [], total: 0 });
    return;
  }

  if (config.trainingMode) {
    // ⚠️ VULN #1: Direct SQL Injection
    // Try: ' OR '1'='1'--
    // Try: ' UNION SELECT id,username,email,password_hash,null,null FROM users--
    // CWE-89
    try {
      const result = await rawQuery(
        `SELECT id, username, display_name, avatar_url, bio, role
         FROM users 
         WHERE (username ILIKE '%${q}%' OR display_name ILIKE '%${q}%')
         AND is_active = true
         LIMIT ${limit} OFFSET ${offset}`
      );

      // ⚠️ VULN #4: Reflected XSS — query param echoed unsanitized
      // Try: q=<script>alert(1)</script>
      res.json({
        users: result.rows,
        total: result.rows.length,
        query: q,  // ⚠️ Reflected back unsanitized
        message: `Search results for: ${q}`,  // ⚠️ XSS vector
      });
    } catch (err: any) {
      // ⚠️ VULN #26: DB error disclosure
      res.status(500).json({
        error: 'Search failed',
        details: err.message,
        query: `SELECT ... WHERE username ILIKE '%${q}%'`,
      });
    }
  } else {
    // 🔒 SECURE: Parameterized query + output encoding
    const searchTerm = `%${(q as string).replace(/[%_]/g, '\\$&')}%`;

    const users = await db('users')
      .select('id', 'username', 'display_name', 'avatar_url', 'bio')
      .where('is_active', true)
      .where((builder) => {
        builder
          .whereILike('username', searchTerm)
          .orWhereILike('display_name', searchTerm);
      })
      .limit(Math.min(parseInt(limit as string), 50))
      .offset(parseInt(offset as string));

    res.json({
      users,
      total: users.length,
      // 🔒 Sanitize query before echoing
      query: xss(q as string),
    });
  }
}

// ─────────────────────────────────────────────
// SEARCH POSTS / HASHTAGS
// ─────────────────────────────────────────────
export async function searchPosts(req: Request, res: Response): Promise<void> {
  const { q, hashtag } = req.query;

  if (config.trainingMode) {
    // ⚠️ VULN: SQL Injection via hashtag search
    let query = `
      SELECT p.*, u.username, u.avatar_url
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.privacy = 'public'
    `;

    if (hashtag) {
      query += ` AND p.content ILIKE '%#${hashtag}%'`;  // ⚠️ Injection
    }
    if (q) {
      query += ` AND p.content ILIKE '%${q}%'`;  // ⚠️ Injection
    }

    query += ' ORDER BY p.created_at DESC LIMIT 20';

    const result = await rawQuery(query);
    res.json({ posts: result.rows });
  } else {
    // 🔒 SECURE
    let queryBuilder = db('posts')
      .join('users', 'posts.user_id', 'users.id')
      .select(
        'posts.id', 'posts.content', 'posts.media_urls',
        'posts.created_at', 'posts.likes_count', 'posts.comments_count',
        'users.username', 'users.avatar_url'
      )
      .where('posts.privacy', 'public');

    if (hashtag) {
      queryBuilder = queryBuilder.whereILike('posts.content', `%#${hashtag}%`);
    }
    if (q) {
      queryBuilder = queryBuilder.whereILike('posts.content', `%${q}%`);
    }

    const posts = await queryBuilder.orderBy('posts.created_at', 'desc').limit(20);
    res.json({ posts });
  }
}

// ─────────────────────────────────────────────
// ADMIN SEARCH (with UNION-based SQLi)
// ─────────────────────────────────────────────
export async function adminSearch(req: Request, res: Response): Promise<void> {
  const { q } = req.query;

  if (config.trainingMode) {
    // ⚠️ VULN: Classic UNION-based SQL Injection
    // Try: ' UNION SELECT username,email,password_hash,null,null,null FROM users--
    try {
      const result = await rawQuery(
        `SELECT id, username, email, display_name, role, created_at
         FROM users
         WHERE username ILIKE '%${q}%' OR email ILIKE '%${q}%'
         ORDER BY created_at DESC`
      );
      res.json({ users: result.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message, hint: 'Check your SQL syntax' });
    }
  } else {
    const users = await db('users')
      .select('id', 'username', 'email', 'display_name', 'role', 'created_at')
      .where('is_active', true)
      .where((b) => b.whereILike('username', `%${q}%`).orWhereILike('email', `%${q}%`))
      .orderBy('created_at', 'desc');
    res.json({ users });
  }
}
