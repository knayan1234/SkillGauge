import { env } from "@/config/env";
import { logMailer } from "./logMailer";
import { createSmtpMailer } from "./smtpMailer";
import type { MailerClient } from "./MailerClient";

let cached: MailerClient | null = null;

/**
 * Returns the configured mailer (cached for the process). `MAIL_PROVIDER=smtp` requires
 * SMTP_HOST + SMTP_USER + SMTP_PASS; if any is missing we fall back to the log mailer
 * (with a warning) so a misconfiguration never breaks the password-reset flow — worst
 * case it just doesn't send the email.
 */
export function getMailer(): MailerClient {
  if (cached) return cached;
  if (
    env.MAIL_PROVIDER === "smtp" &&
    env.SMTP_HOST &&
    env.SMTP_USER &&
    env.SMTP_PASS
  ) {
    cached = createSmtpMailer();
  } else {
    if (env.MAIL_PROVIDER === "smtp") {
      // eslint-disable-next-line no-console
      console.warn(
        "[mail] MAIL_PROVIDER=smtp but SMTP_HOST/USER/PASS are not all set — falling back to the log mailer.",
      );
    }
    cached = logMailer;
  }
  return cached;
}
