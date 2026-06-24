import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/config/env";
import type { MailerClient } from "./MailerClient";

/**
 * SMTP mailer via Nodemailer — works with any SMTP provider (Brevo, Gmail, SES, ...).
 * Credentials come from env (SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS); the sender is
 * MAIL_FROM (must be a verified sender on the provider, or it rejects the send). `secure`
 * is true only on port 465 (implicit TLS); 587 (Brevo's default) negotiates STARTTLS.
 */
export function createSmtpMailer(): MailerClient {
  const transporter: Transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    // Fail fast instead of hanging if the SMTP host is slow or unreachable (some hosts
    // throttle outbound SMTP). Keeps the background send from dangling indefinitely.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return {
    async sendPasswordReset(to, resetUrl) {
      await transporter.sendMail({
        from: env.MAIL_FROM,
        to,
        subject: "Reset your SkillGauge password",
        text: [
          "We received a request to reset your SkillGauge password.",
          "",
          `Set a new one here (this link expires in ${env.RESET_TTL_MIN} minutes):`,
          resetUrl,
          "",
          "If you didn't request this, you can safely ignore this email.",
        ].join("\n"),
        html: resetEmailHtml(resetUrl, env.RESET_TTL_MIN),
      });
    },
  };
}

// Inline-styled HTML — email clients strip <style> blocks, so styles must be inline.
function resetEmailHtml(resetUrl: string, expiryMin: number): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#27272a">
  <h1 style="font-size:20px;margin:0 0 16px">Reset your SkillGauge password</h1>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#52525b">We received a request to reset your password. Click the button below to choose a new one.</p>
  <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px">Set a new password</a>
  <p style="font-size:12px;line-height:1.6;margin:20px 0 0;color:#71717a">This link expires in ${expiryMin} minutes. If you didn't request this, you can safely ignore this email.</p>
  <p style="font-size:12px;line-height:1.6;margin:12px 0 0;color:#a1a1aa;word-break:break-all">Or paste this link into your browser:<br>${resetUrl}</p>
</div>`;
}
