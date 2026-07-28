import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  oauthGoogleCallback,
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { loginRateLimiter, passwordResetRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─── Public routes ───
router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refreshToken);
router.post('/forgot-password', passwordResetRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify/:token', verifyEmail);
router.get('/oauth/google/callback', oauthGoogleCallback);

// ─── Protected routes ───
router.post('/logout', authMiddleware, logout);

export default router;
