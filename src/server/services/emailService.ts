import { logger } from '../utils/logger';

export const emailService = {
  async sendEmail(to: string, subject: string, text: string) {
    logger.info(`📧 [Email Sent] To: ${to} | Subject: ${subject}`);
    return true;
  },
  async sendPasswordResetEmail(to: string, token: string) {
    logger.info(`📧 [Password Reset] To: ${to} | Token: ${token}`);
    return true;
  },
  async sendVerificationEmail(to: string, code: string) {
    logger.info(`📧 [Verification] To: ${to} | Code: ${code}`);
    return true;
  }
};
