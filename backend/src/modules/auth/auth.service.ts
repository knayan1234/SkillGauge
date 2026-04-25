import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { loginAttemptsRepo } from "@/db/repos/loginAttempts";
import { usersRepo } from "@/db/repos/users";
import { hashEmailForLog } from "@/shared/audit";
import type { User } from "@/shared/types";

// 10 rounds is the bcrypt default sweet spot (~100ms per hash on commodity hardware).
// Bump to 12 in production if compute budget allows; higher is exponentially slower.
const BCRYPT_ROUNDS = 10;

export class AuthError extends Error {
  constructor(
    public readonly code:
      | "EMAIL_TAKEN"
      | "INVALID_CREDENTIALS"
      // Phase 1.5c: per-email soft lockout after N failed attempts in a rolling window.
      // 423 Locked (RFC 4918) maps cleanly. Distinct from rate-limit (429) so the FE can
      // show a "try again in 15 minutes or reset your password" message specifically.
      | "ACCOUNT_LOCKED",
    message: string,
  ) {
    super(message);
  }
}

function toApiUser(doc: { _id: string; email: string; name: string }): User {
  return { id: doc._id, email: doc.email, name: doc.name };
}

// Phase 1.5d: helper that returns the user's current jwtEpoch, defaulting legacy docs
// (registered before 1.5d landed) to 1. Centralized so a future migration that backfills
// the field for all users only has to flip this in one place.
function epochOf(doc: { jwtEpoch?: number }): number {
  return doc.jwtEpoch ?? 1;
}

// What register/login return to the route layer. The route destructures `epoch` to feed
// into `signSessionToken(userId, epoch)` — the `User` shape stays wire-facing (no epoch
// leakage to the FE).
export interface AuthResult {
  user: User;
  epoch: number;
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResult> {
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      // Uniform error timing isn't enforced here — Phase 1 scope. A production auth layer
      // should add a timing-equaliser to avoid email-enumeration via response time.
      throw new AuthError("EMAIL_TAKEN", "Email already registered");
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    // Phase 1.5d: every new user starts at epoch 1. The first time the epoch ever bumps
    // (logout-all, password reset), tokens signed with epoch 1 become INVALID_SESSION.
    const doc = {
      _id: randomUUID(),
      email,
      passwordHash,
      name: email.split("@")[0],
      createdAt: new Date().toISOString(),
      jwtEpoch: 1,
    };
    await usersRepo.create(doc);
    return { user: toApiUser(doc), epoch: epochOf(doc) };
  },

  async login(email: string, password: string, ip = "unknown"): Promise<AuthResult> {
    // Phase 1.5c: pre-bcrypt lockout check. We hash by email (not by user ID) so even
    // unknown emails count toward a lockout — denying attackers an "exists vs not"
    // signal. The check runs BEFORE the bcrypt to keep CPU bounded under attack.
    const emailHash = hashEmailForLog(email);
    const failures = await loginAttemptsRepo.countActive(emailHash);
    if (failures >= env.LOGIN_LOCKOUT_THRESHOLD) {
      throw new AuthError(
        "ACCOUNT_LOCKED",
        `Too many failed attempts. Try again in ${env.LOGIN_LOCKOUT_WINDOW_MIN} minutes or reset your password.`,
      );
    }

    const doc = await usersRepo.findByEmail(email);
    if (!doc) {
      // Same error for "no such user" and "wrong password" — don't leak account existence.
      await this._recordFailure(emailHash, ip);
      throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
    }
    const ok = await bcrypt.compare(password, doc.passwordHash);
    if (!ok) {
      await this._recordFailure(emailHash, ip);
      throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
    }

    // Successful login wipes the failure streak so the user can fail-then-succeed-then-fail
    // without re-locking immediately. The TTL would clean up eventually, but explicit
    // clear is correct semantics: you proved you own the account, the streak is over.
    await loginAttemptsRepo.clear(emailHash);

    return { user: toApiUser(doc), epoch: epochOf(doc) };
  },

  // Internal helper. Public-facing methods call this on every failed login. The TTL on
  // the inserted doc matches LOGIN_LOCKOUT_WINDOW_MIN — failures auto-expire as the
  // rolling window slides.
  async _recordFailure(emailHash: string, ip: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + env.LOGIN_LOCKOUT_WINDOW_MIN * 60 * 1000,
    );
    await loginAttemptsRepo.record({
      _id: randomUUID(),
      emailHash,
      ip,
      failedAt: now,
      expiresAt,
    });
  },

  async getById(userId: string): Promise<User | null> {
    const doc = await usersRepo.findById(userId);
    return doc ? toApiUser(doc) : null;
  },
};
