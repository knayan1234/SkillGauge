import { createHash } from "node:crypto";

// Pseudonymous identifier for an email address, suitable for log lines and rate counters.
// SHA-256 over the trimmed/lowercased input so casing doesn't fragment the bucket. Truncated
// to 16 hex chars (64 bits) — collision risk is negligible at our scale and the short prefix
// keeps log lines readable. Never log the raw email; this is the only correlator that ships.
export function hashEmailForLog(email: string): string {
  const normalized = email.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}
