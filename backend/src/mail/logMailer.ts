import type { MailerClient } from "./MailerClient";

/**
 * Default mailer — logs the reset link to stdout instead of sending. Used in dev and as
 * the fallback when SMTP isn't configured, preserving the original behavior so the
 * password-reset flow never hard-depends on a mail provider being wired.
 */
export const logMailer: MailerClient = {
  async sendPasswordReset(to, resetUrl) {
    // eslint-disable-next-line no-console
    console.log(`[mail:log] password reset → ${to}: ${resetUrl}`);
  },
};
