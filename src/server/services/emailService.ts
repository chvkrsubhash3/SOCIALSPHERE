import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: config.smtp.user
    ? {
        user: config.smtp.user,
        pass: config.smtp.pass,
      }
    : undefined,
});

export const emailService = {
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await transporter.sendMail({
        from: config.smtp.from || config.smtp.user,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });
      logger.info(`📧 Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (err) {
      logger.error('Failed to send email:', err);
      return false;
    }
  },

  async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    const text = `You requested a password reset. Click here to reset: ${resetUrl}`;
    const html = `<h2>Password Reset Request</h2><p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`;
    return this.sendEmail(to, 'Password Reset - SocialSphere', text, html);
  },

  async sendVerificationEmail(to: string, code: string) {
    const text = `Your verification code is: ${code}`;
    const html = `<h2>Email Verification</h2><p>Your verification code is: <strong>${code}</strong></p>`;
    return this.sendEmail(to, 'Verify Your Email - SocialSphere', text, html);
  },
};
