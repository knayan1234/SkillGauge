import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";
import type { MailerClient } from "./MailerClient";
import { RESET_SUBJECT, resetHtmlBody, resetTextBody } from "./resetTemplate";

/**
 * SMTP mailer via Nodemailer — works with any SMTP provider (Brevo, Gmail, SES, ...).
 * Credentials come from env (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS); the sender is
 * MAIL_FROM (must be a verified sender on the provider). `secure` is true only on port 465
 * (implicit TLS); 587 negotiates STARTTLS.
 *
 * Note: many PaaS hosts (incl. Render free) throttle/block outbound SMTP ports, which makes
 * the connection hang. If that happens, use MAIL_PROVIDER=brevo (HTTP API over 443) instead.
 */
export function createSmtpMailer(): MailerClient {
  const transporter: Transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    // Fail fast instead of hanging if the SMTP host is slow or unreachable.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return {
    async sendPasswordReset(to, resetUrl) {
      await transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: RESET_SUBJECT,
        text: resetTextBody(resetUrl, env.RESET_TTL_MIN),
        html: resetHtmlBody(resetUrl, env.RESET_TTL_MIN),
      });
    },
  };
}
