/**
 * MailerClient — provider-agnostic transactional email, mirroring the LLMClient /
 * EmbeddingsClient pattern so the SMTP vendor stays swappable and isolated behind one
 * interface. The app only sends the password-reset link today, so the surface is narrow;
 * add methods here as more transactional mail appears.
 */
export interface MailerClient {
  /** Email the password-reset link — `resetUrl` is an absolute URL to /reset?token=... */
  sendPasswordReset(to: string, resetUrl: string): Promise<void>;
}
