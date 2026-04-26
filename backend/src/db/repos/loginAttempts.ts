/**
 * Persistence for failed-login records, used by the per-email lockout.
 *
 * Why a separate collection (rather than a column on `users`)?
 *   1. We want lockout to happen even for unknown emails — otherwise an attacker can
 *      probe registered-vs-unregistered by timing differences. So we need to track
 *      failures by `emailHash` regardless of whether a user exists.
 *   2. Bounded growth. A counter column on `users` would never auto-clean. This collection
 *      uses a TTL index so each failure auto-deletes after the lockout window expires.
 *
 * Hashed email (16 hex chars from `hashEmailForLog`) — never the raw email. Same hashing
 * function as the failed-login audit log so the lockout count and the audit log lines are
 * directly correlatable in a debug session.
 */

import { getDb } from "../connection";

export interface LoginAttemptDoc {
  _id: string;            // UUID — random handle, no semantics
  emailHash: string;      // SHA-256 prefix from hashEmailForLog
  ip: string;             // remote IP, for forensics — not used in the count itself
  failedAt: Date;         // when the failure happened
  expiresAt: Date;        // TTL index → auto-delete after the lockout window
}

async function attempts() {
  return (await getDb()).collection<LoginAttemptDoc>("login_attempts");
}

export const loginAttemptsRepo = {
  async record(doc: LoginAttemptDoc): Promise<void> {
    await (await attempts()).insertOne(doc);
  },

  // Count active (un-expired) failures for this email. We rely on the TTL index to
  // auto-delete old ones, but Mongo's TTL sweeper runs ~60s — to avoid counting docs
  // that should already be gone, we filter on `expiresAt > now` explicitly.
  async countActive(emailHash: string, now: Date = new Date()): Promise<number> {
    return (await attempts()).countDocuments({
      emailHash,
      expiresAt: { $gt: now },
    });
  },

  // On successful login, wipe this email's outstanding failures so the next failure
  // streak starts fresh. Otherwise a user who locks themselves out, succeeds, then
  // re-fails would inherit the old count and re-lock too quickly.
  async clear(emailHash: string): Promise<void> {
    await (await attempts()).deleteMany({ emailHash });
  },
};
