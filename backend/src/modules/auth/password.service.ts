// Business logic for password reset. Split from auth.service.ts so each service file has
// a single concern (login/register vs reset). Routes thin-wrap these — no DB or crypto in
// route handlers.

import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { passwordResetTokensRepo } from "@/db/repos/passwordResetTokens";
import { usersRepo } from "@/db/repos/users";
import { getMailer } from "@/mail";

// Same bcrypt cost as register/login — must match so password verification stays consistent.
const BCRYPT_ROUNDS = 10;

// 32 bytes = 256 bits of entropy. Hex-encoded → 64 chars on the wire. Good headroom against
// brute-force even without rate limits (we add those at the route layer anyway).
const TOKEN_BYTES = 32;

// Errors carry a `code` for the route layer to translate into the wire {code, message}
// shape. Following the AuthError pattern from auth.service.ts for consistency.
export class PasswordResetError extends Error {
  constructor(
    public readonly code: "INVALID_TOKEN",
    message: string,
  ) {
    super(message);
  }
}

// Result returned to the route. `link` is null in production builds — there it'd be
// emailed via a real provider. Today: dev-mode helper. The FE never sees `link`; the
// route logs it to stdout and returns the opaque empty 200 to the caller.
export interface ResetRequestResult {
  link: string | null;
}

function hashToken(plain: string): string {
  return createHash("sha256").update(plain).digest("hex");
}

export const passwordResetService = {
  // Always succeeds from the caller's perspective — no enumeration of registered emails.
  // If the user exists, we generate + store a token. If not, we return null silently and
  // the route still emits a 200. Same response time? Not strictly equalized today;
  // TODO: add timing equalizer once rate limits are in place.
  async requestReset(email: string): Promise<ResetRequestResult> {
    const user = await usersRepo.findByEmail(email);
    if (!user) {
      return { link: null };
    }

    const plainToken = randomBytes(TOKEN_BYTES).toString("hex");
    const tokenHash = hashToken(plainToken);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + env.RESET_TTL_MIN * 60 * 1000);

    await passwordResetTokensRepo.create({
      _id: randomUUID(),
      userId: user._id,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: now,
    });

    const link = `/reset?token=${plainToken}`;
    // FIRE-AND-FORGET — do NOT await the email. Blocking the response on SMTP means a slow
    // or unreachable mail server times out the whole request (504 at the gateway). The token
    // is already persisted and the route returns an opaque 200 regardless, so the send is a
    // background side effect. Render is a long-lived process, so the promise still completes
    // after we return. Failures are logged, never surfaced.
    void getMailer()
      .sendPasswordReset(email, `${env.APP_URL}${link}`)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[mail] password-reset send failed:", err);
      });
    return { link };
  },

  // Single-use, time-limited. Three failure modes all collapse to INVALID_TOKEN so an
  // attacker can't distinguish "wrong token" from "expired" from "already used."
  async confirmReset(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(plainToken);
    const doc = await passwordResetTokensRepo.findByHash(tokenHash);

    if (!doc) {
      throw new PasswordResetError("INVALID_TOKEN", "Invalid or expired reset token");
    }
    if (doc.usedAt !== null) {
      throw new PasswordResetError("INVALID_TOKEN", "Invalid or expired reset token");
    }
    if (doc.expiresAt.getTime() <= Date.now()) {
      // Mongo's TTL sweeper deletes within ~60s of expiry; this catches the gap.
      throw new PasswordResetError("INVALID_TOKEN", "Invalid or expired reset token");
    }

    // Atomic mark-used. If two parallel confirms hit, only one wins; the loser sees null.
    const claimed = await passwordResetTokensRepo.markUsed(doc._id);
    if (!claimed) {
      throw new PasswordResetError("INVALID_TOKEN", "Invalid or expired reset token");
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await usersRepo.updatePasswordHash(doc.userId, passwordHash);

    // A password reset MUST invalidate every existing session for this user. Bumping
    // jwtEpoch makes every previously-signed token fail requireAuth's epoch check on the
    // next request — instant global logout, no token tracking required.
    await usersRepo.bumpJwtEpoch(doc.userId);
  },
};
