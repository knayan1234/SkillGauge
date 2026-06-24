import { env } from "@/config/env";
import type { MailerClient } from "./MailerClient";
import {
  RESET_SUBJECT,
  resetHtmlBody,
  resetTextBody,
  parseFromAddress,
} from "./resetTemplate";

/**
 * Brevo transactional email over the HTTP API (https://api.brevo.com/v3/smtp/email).
 * Uses HTTPS (443) instead of SMTP ports, which PaaS hosts (incl. Render free) often
 * throttle or block — so this is the reliable path when SMTP connections hang/time out.
 * Auth is the Brevo API key (xkeysib-...), which is distinct from the SMTP key.
 */
export function createBrevoApiMailer(): MailerClient {
  const sender = parseFromAddress(env.MAIL_FROM);

  return {
    async sendPasswordReset(to, resetUrl) {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": env.BREVO_API_KEY ?? "",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender,
          to: [{ email: to }],
          subject: RESET_SUBJECT,
          htmlContent: resetHtmlBody(resetUrl, env.RESET_TTL_MIN),
          textContent: resetTextBody(resetUrl, env.RESET_TTL_MIN),
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Brevo API ${res.status}: ${detail}`);
      }
    },
  };
}
