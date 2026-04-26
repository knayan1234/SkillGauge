// Persistence for password reset tokens. Single-use, time-limited bearer credentials.
// Only the SHA-256 hash of the plain token is stored — the plain token only ever exists
// in the email link (today: stdout in dev). This means a DB leak doesn't expose live tokens.

import { getDb } from "../connection";

export interface PasswordResetTokenDoc {
  _id: string;            // UUID — unique handle, not user-facing
  userId: string;         // FK to users._id
  tokenHash: string;      // SHA-256 hex of the plain token
  expiresAt: Date;        // TTL index will auto-delete after this
  usedAt: Date | null;    // set on consumption — replay protection
  createdAt: Date;        // for audit
}

async function tokens() {
  return (await getDb()).collection<PasswordResetTokenDoc>("password_reset_tokens");
}

export const passwordResetTokensRepo = {
  async create(doc: PasswordResetTokenDoc): Promise<void> {
    await (await tokens()).insertOne(doc);
  },

  // Lookup by hash, not by the plain token. The route hashes the incoming token first.
  async findByHash(tokenHash: string): Promise<PasswordResetTokenDoc | null> {
    return (await tokens()).findOne({ tokenHash });
  },

  // Atomic consume — sets usedAt only if it's still null. Returns the updated doc on
  // success, null if the token was already consumed (race or replay).
  async markUsed(id: string): Promise<PasswordResetTokenDoc | null> {
    const res = await (await tokens()).findOneAndUpdate(
      { _id: id, usedAt: null },
      { $set: { usedAt: new Date() } },
      { returnDocument: "after" },
    );
    return res ?? null;
  },

};
