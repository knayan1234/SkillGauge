import { env } from "@/config/env";
import { logMailer } from "./logMailer";
import { createSmtpMailer } from "./smtpMailer";
import { createBrevoApiMailer } from "./brevoApiMailer";
import type { MailerClient } from "./MailerClient";

let cached: MailerClient | null = null;

/**
 * Returns the configured mailer (cached for the process), chosen by MAIL_PROVIDER:
 *   - "brevo" → Brevo HTTP API over HTTPS/443 (reliable on PaaS that block SMTP ports).
 *              Requires BREVO_API_KEY.
 *   - "smtp"  → Nodemailer over SMTP (any provider). Requires SMTP_HOST/USER/PASS.
 *   - "log"   → logs the link, no send (default; dev / unconfigured).
 *
 * If a provider is selected without its credentials, we fall back to the log mailer (with
 * a warning) so a misconfiguration never breaks the password-reset flow — it just won't send.
 */
export function getMailer(): MailerClient {
  if (cached) return cached;

  if (env.MAIL_PROVIDER === "brevo" && env.BREVO_API_KEY) {
    cached = createBrevoApiMailer();
  } else if (
    env.MAIL_PROVIDER === "smtp" &&
    env.SMTP_HOST &&
    env.SMTP_USER &&
    env.SMTP_PASS
  ) {
    cached = createSmtpMailer();
  } else {
    if (env.MAIL_PROVIDER !== "log") {
      // eslint-disable-next-line no-console
      console.warn(
        `[mail] MAIL_PROVIDER=${env.MAIL_PROVIDER} but its credentials are missing — falling back to the log mailer.`,
      );
    }
    cached = logMailer;
  }

  return cached;
}
