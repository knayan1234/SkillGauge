/**
 * Shared password-reset email content (+ a From-address parser), used by both the SMTP
 * and Brevo-HTTP-API mailers so the message is identical regardless of transport.
 */
export const RESET_SUBJECT = "Reset your SkillGauge password";

export function resetTextBody(resetUrl: string, expiryMin: number): string {
  return [
    "We received a request to reset your SkillGauge password.",
    "",
    `Set a new one here (this link expires in ${expiryMin} minutes):`,
    resetUrl,
    "",
    "If you didn't request this, you can safely ignore this email.",
  ].join("\n");
}

// Inline-styled — email clients strip <style> blocks, so styles must be inline.
export function resetHtmlBody(resetUrl: string, expiryMin: number): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#27272a">
  <h1 style="font-size:20px;margin:0 0 16px">Reset your SkillGauge password</h1>
  <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#52525b">We received a request to reset your password. Click the button below to choose a new one.</p>
  <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:8px">Set a new password</a>
  <p style="font-size:12px;line-height:1.6;margin:20px 0 0;color:#71717a">This link expires in ${expiryMin} minutes. If you didn't request this, you can safely ignore this email.</p>
  <p style="font-size:12px;line-height:1.6;margin:12px 0 0;color:#a1a1aa;word-break:break-all">Or paste this link into your browser:<br>${resetUrl}</p>
</div>`;
}

/** Split "Name <email>" (or a bare "email") into { name, email } for APIs that need them apart. */
export function parseFromAddress(from: string): { name: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || "SkillGauge", email: m[2].trim() };
  return { name: "SkillGauge", email: from.trim() };
}
