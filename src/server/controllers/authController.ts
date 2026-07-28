import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db, rawQuery, ensureDatabaseTables } from '../config/database';
import { redis } from '../config/redis';
import { config } from '../config/env';
import { generateTokens } from '../middleware/auth';
import { emailService } from '../services/emailService';
import { logger, logSecurityEvent, logAudit } from '../utils/logger';

// ═══════════════════════════════════════════════════════════════
//                    AUTH CONTROLLER
//
//  Contains intentional vulnerabilities for training purposes.
//  Each vulnerability is clearly marked with ⚠️ or 🔒
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
export async function register(req: Request, res: Response): Promise<void> {
  await ensureDatabaseTables();
  const { username, email, password, displayName } = req.body;

  // ─── Input Validation ───
  if (!username || !email || !password) {
    res.status(400).json({ error: 'Username, email, and password are required' });
    return;
  }

  // ─── Check if email/username exists ───

  if (config.trainingMode) {
    // ⚠️ VULN #31: Email Enumeration
    // Returns different messages for existing vs new emails
    // CWE-204: Observable Response Discrepancy
    const existingEmail = await db('users').where({ email }).first();
    if (existingEmail) {
      // ⚠️ Tells attacker this email is registered
      res.status(409).json({ error: 'Email address is already registered' });
      return;
    }

    const existingUsername = await db('users').where({ username }).first();
    if (existingUsername) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }
  } else {
    // 🔒 SECURE: Generic message (no enumeration)
    const existing = await db('users')
      .where({ email })
      .orWhere({ username })
      .first();
    if (existing) {
      res.status(409).json({
        error: 'Account with these credentials already exists',
      });
      return;
    }
  }

  // ─── Password Policy ───

  // ⚠️ VULN #41: Weak Password Policy (training mode)
  if (config.trainingMode) {
    if (password.length < 3) {
      res.status(400).json({ error: 'Password must be at least 3 characters' });
      return;
    }
  } else {
    // 🔒 SECURE: Strong password policy
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    if (!strongPassword.test(password)) {
      res.status(400).json({
        error: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character',
      });
      return;
    }
  }

  // ─── Password Hashing ───
  let passwordHash: string;

  if (config.trainingMode) {
    // ⚠️ VULN #42: Insecure Password Storage
    // Uses MD5 (cryptographically broken) with no salt
    // CWE-916: Use of Password Hash With Insufficient Computational Effort
    passwordHash = crypto.createHash('md5').update(password).digest('hex');
    logger.warn('⚠️ Using MD5 password hashing (Training Mode - INSECURE!)');
  } else {
    // 🔒 SECURE: Argon2id (winner of Password Hashing Competition)
    passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,  // 64MB
      timeCost: 3,
      parallelism: 4,
    });
  }

  // ─── Email Verification Token ───

  let verificationToken: string;
  if (config.trainingMode) {
    // ⚠️ VULN #43: Predictable Token
    // Uses timestamp-based token (predictable)
    // CWE-340: Generation of Predictable Numbers or Identifiers
    verificationToken = `verify_${Date.now()}_${username}`;
    logger.warn('⚠️ Using predictable verification token (Training Mode)');
  } else {
    // 🔒 SECURE: Cryptographically secure random token
    verificationToken = crypto.randomBytes(32).toString('hex');
  }

  // ─── Create User ───
  let userId: number = 0;
  try {
    const inserted = await db('users').insert({
      username,
      email,
      password_hash: passwordHash,
      display_name: displayName || username,
      role: 'user',
      is_active: true,
      is_verified: false,
      verification_token: verificationToken,
      created_at: new Date(),
    }).returning('id');

    userId = Array.isArray(inserted)
      ? (typeof inserted[0] === 'object' ? (inserted[0] as any).id : inserted[0])
      : inserted;
  } catch (err: any) {
    logger.error('Registration database insert failed:', err);
    res.status(500).json({ error: err.message || 'Failed to create user' });
    return;
  }

  // Initialize user coins
  try {
    if (userId) {
      await db('user_coins').insert({ user_id: userId, balance: 100 });
    }
  } catch {
    // Non-critical
  }

  // Send verification email
  try {
    await emailService.sendVerificationEmail(email, verificationToken);
  } catch (emailErr) {
    logger.warn('Failed to send verification email during registration:', emailErr);
  }

  logAudit({
    action: 'USER_REGISTERED',
    userId: userId,
    resource: 'users',
    resourceId: userId,
    ip: req.ip,
    result: 'success',
  });

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account.',
    userId: userId,
    // ⚠️ TRAINING: Return token in response (should only be sent via email)
    ...(config.trainingMode && { verificationToken }),
  });
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
export async function login(req: Request, res: Response): Promise<void> {
  await ensureDatabaseTables();
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  let user: any;

  if (config.trainingMode) {
    // ⚠️ VULN #1: SQL Injection in login
    // Direct string interpolation — vulnerable to: ' OR '1'='1
    // CWE-89: SQL Injection
    // CVSS: 9.8 Critical
    try {
      const result = await rawQuery(
        `SELECT * FROM users WHERE email = '${email}' AND password_hash = '${
          crypto.createHash('md5').update(password).digest('hex')
        }'`
      );
      user = result?.rows ? result.rows[0] : (Array.isArray(result) ? result[0] : result);
    } catch (err: any) {
      // ⚠️ VULN #26: Stack trace disclosure
      res.status(500).json({
        error: 'Database error',
        query: `SELECT * FROM users WHERE email = '${email}'...`,  // ⚠️ Leaks query
        details: err.message,
      });
      return;
    }
  } else {
    // 🔒 SECURE: Parameterized query + Argon2 verification
    user = await db('users').where({ email, is_active: true }).first();
    if (!user) {
      // 🔒 SECURE: Constant-time comparison (prevents timing attacks)
      await argon2.verify('$argon2id$v=19$m=65536,t=3,p=4$dummy', 'dummy');
      // 🔒 SECURE: Generic error (no enumeration)
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await argon2.verify(user.password_hash, password);
    if (!isValid) {
      logSecurityEvent({
        type: 'LOGIN_FAILED',
        userId: user.id.toString(),
        ip: req.ip,
        severity: 'medium',
      });
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
  }

  if (!user) {
    if (config.trainingMode) {
      // ⚠️ VULN #32: Username/Email Enumeration
      // Different error messages reveal if email exists
      const emailExists = await db('users').where({ email }).first();
      if (emailExists) {
        res.status(401).json({ error: 'Incorrect password' });
      } else {
        res.status(401).json({ error: 'No account found with this email' });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
    return;
  }

  // ─── Session Fixation ───
  if (config.trainingMode) {
    // ⚠️ VULN #23: Session Fixation
    // Uses pre-existing session ID from cookie without regenerating
    // CWE-384: Session Fixation
    logger.warn('⚠️ Session not regenerated after login (Training Mode)');
  }

  // ─── Generate Tokens ───
  const { accessToken, refreshToken } = generateTokens(user);

  // Store refresh token
  await db('refresh_tokens').insert({
    user_id: user.id,
    token: refreshToken,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created_at: new Date(),
  });

  // ─── Cookie Settings ───
  if (config.trainingMode) {
    // ⚠️ VULN #44: Insecure Cookie Settings
    // No HttpOnly, No Secure, No SameSite
    // CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute
    res.cookie('access_token', accessToken, {
      httpOnly: false,   // ⚠️ XSS-accessible
      secure: false,     // ⚠️ Sent over HTTP
      sameSite: 'none',  // ⚠️ CSRF possible
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'none',
    });
  } else {
    // 🔒 SECURE: Hardened cookie settings
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: config.security.cookieSecure,
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : undefined,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: config.security.cookieSecure,
      sameSite: 'strict',
      path: '/api/auth/refresh',
    });
  }

  // Update last login
  await db('users').where({ id: user.id }).update({
    last_login_at: new Date(),
    last_login_ip: req.ip,
  });

  logAudit({
    action: 'USER_LOGIN',
    userId: user.id,
    ip: req.ip,
    result: 'success',
  });

  res.json({
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      avatar: user.avatar_url,
      role: user.role,
      isVerified: user.is_verified,
    },
  });
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
export async function logout(req: Request, res: Response): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.access_token;

  if (token) {
    // Blacklist the token
    await redis.setex(`blacklist:${token}`, 15 * 60, '1');

    // Remove refresh token
    if (req.user) {
      await db('refresh_tokens').where({ user_id: req.user.userId }).delete();
    }
  }

  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  res.json({ message: 'Logged out successfully' });
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.body.refreshToken || req.cookies?.refresh_token;

  if (!token) {
    res.status(401).json({ error: 'Refresh token required' });
    return;
  }

  if (config.trainingMode) {
    // ⚠️ VULN #8: Refresh Token Abuse
    // No validation that token belongs to requesting user
    // Accepts any valid refresh token
    const stored = await db('refresh_tokens').where({ token }).first();
    if (!stored) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = await db('users').where({ id: stored.user_id }).first();
    const tokens = generateTokens(user);

    // ⚠️ VULN: Doesn't rotate refresh token (refresh token abuse possible)
    res.json(tokens);
  } else {
    // 🔒 SECURE: Validate token ownership + rotate
    import('jsonwebtoken').then(async ({ default: jwt }) => {
      try {
        const payload = jwt.verify(token, config.jwtRefreshSecret) as any;

        const stored = await db('refresh_tokens')
          .where({ token, user_id: payload.userId })
          .first();

        if (!stored || new Date(stored.expires_at) < new Date()) {
          res.status(401).json({ error: 'Invalid or expired refresh token' });
          return;
        }

        const user = await db('users').where({ id: payload.userId }).first();
        const tokens = generateTokens(user);

        // 🔒 Rotate: delete old, store new
        await db('refresh_tokens').where({ token }).delete();
        await db('refresh_tokens').insert({
          user_id: user.id,
          token: tokens.refreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        res.json(tokens);
      } catch {
        res.status(401).json({ error: 'Invalid refresh token' });
      }
    });
  }
}

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const user = await db('users').where({ email }).first();

  if (config.trainingMode) {
    // ⚠️ VULN #31: Email Enumeration via forgot password
    if (!user) {
      res.status(404).json({ error: 'No account found with this email address' });
      return;
    }

    // ⚠️ VULN #43: Predictable reset token
    const resetToken = `reset_${user.id}_${Date.now()}`;

    await db('password_reset_tokens').insert({
      user_id: user.id,
      token: resetToken,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),  // 24h
      created_at: new Date(),
    });

    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({
      message: 'Password reset email sent',
      // ⚠️ TRAINING: Leaks token in response
      resetToken,
      expiresIn: '24 hours',
    });
  } else {
    // 🔒 SECURE: Always return same response (no enumeration)
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      await db('password_reset_tokens').insert({
        user_id: user.id,
        token: hashedToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000),  // 1h only
        created_at: new Date(),
      });

      await emailService.sendPasswordResetEmail(email, resetToken);
    }

    // 🔒 Same response regardless of whether email exists
    res.json({
      message: 'If an account exists with this email, a reset link has been sent',
    });
  }
}

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400).json({ error: 'Token and new password are required' });
    return;
  }

  // Find token
  const resetRecord = await db('password_reset_tokens')
    .where({ token })
    .where('expires_at', '>', new Date())
    .first();

  if (!resetRecord) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  // Hash new password
  let passwordHash: string;
  if (config.trainingMode) {
    // ⚠️ VULN: MD5 hashing again
    passwordHash = crypto.createHash('md5').update(newPassword).digest('hex');
  } else {
    passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  // Update password
  await db('users')
    .where({ id: resetRecord.user_id })
    .update({ password_hash: passwordHash });

  // Invalidate token
  await db('password_reset_tokens').where({ token }).delete();

  // Invalidate all sessions
  await db('refresh_tokens').where({ user_id: resetRecord.user_id }).delete();

  logAudit({
    action: 'PASSWORD_RESET',
    userId: resetRecord.user_id,
    ip: req.ip,
    result: 'success',
  });

  res.json({ message: 'Password reset successfully. Please login with your new password.' });
}

// ─────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────
export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.params;

  const user = await db('users')
    .where({ verification_token: token, is_verified: false })
    .first();

  if (!user) {
    res.status(400).json({ error: 'Invalid or already used verification token' });
    return;
  }

  await db('users').where({ id: user.id }).update({
    is_verified: true,
    verification_token: null,
  });

  res.json({ message: 'Email verified successfully! You can now login.' });
}

// ─────────────────────────────────────────────
// OAUTH — Google
// ─────────────────────────────────────────────
export async function oauthGoogleCallback(req: Request, res: Response): Promise<void> {
  const { code, state, redirect_uri } = req.query;

  if (config.trainingMode) {
    // ⚠️ VULN #25: OAuth Misconfiguration
    // No state parameter validation (CSRF)
    // No redirect_uri validation (Open Redirect)
    // CWE-601: URL Redirection to Untrusted Site
    logger.warn('⚠️ OAuth state not validated (Training Mode)');

    // Simulate OAuth token exchange (for lab purposes)
    // In real training, this would use actual Google OAuth
    const redirectTo = (redirect_uri as string) || '/feed';
    res.redirect(redirectTo);  // ⚠️ VULN: Unvalidated redirect
  } else {
    // 🔒 SECURE: Validate state, validate redirect_uri
    const storedState = req.cookies?.oauth_state;
    if (!state || state !== storedState) {
      res.status(403).json({ error: 'Invalid OAuth state (CSRF protection)' });
      return;
    }

    const ALLOWED_REDIRECTS = ['/feed', '/profile', '/settings'];
    const redirectTo = ALLOWED_REDIRECTS.includes(redirect_uri as string)
      ? redirect_uri as string
      : '/feed';

    res.redirect(redirectTo);
  }
}
