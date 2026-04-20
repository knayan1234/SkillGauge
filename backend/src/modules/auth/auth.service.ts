import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { usersRepo } from "@/db/repos/users";
import type { User } from "@/shared/types";

// 10 rounds is the bcrypt default sweet spot (~100ms per hash on commodity hardware).
// Bump to 12 in production if compute budget allows; higher is exponentially slower.
const BCRYPT_ROUNDS = 10;

export class AuthError extends Error {
  constructor(
    public readonly code: "EMAIL_TAKEN" | "INVALID_CREDENTIALS",
    message: string,
  ) {
    super(message);
  }
}

function toApiUser(doc: { _id: string; email: string; name: string }): User {
  return { id: doc._id, email: doc.email, name: doc.name };
}

export const authService = {
  async register(email: string, password: string): Promise<User> {
    const existing = await usersRepo.findByEmail(email);
    if (existing) {
      // Uniform error timing isn't enforced here — Phase 1 scope. A production auth layer
      // should add a timing-equaliser to avoid email-enumeration via response time.
      throw new AuthError("EMAIL_TAKEN", "Email already registered");
    }
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const doc = {
      _id: randomUUID(),
      email,
      passwordHash,
      name: email.split("@")[0],
      createdAt: new Date().toISOString(),
    };
    await usersRepo.create(doc);
    return toApiUser(doc);
  },

  async login(email: string, password: string): Promise<User> {
    const doc = await usersRepo.findByEmail(email);
    if (!doc) {
      // Same error for "no such user" and "wrong password" — don't leak account existence.
      throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
    }
    const ok = await bcrypt.compare(password, doc.passwordHash);
    if (!ok) {
      throw new AuthError("INVALID_CREDENTIALS", "Invalid email or password");
    }
    return toApiUser(doc);
  },

  async getById(userId: string): Promise<User | null> {
    const doc = await usersRepo.findById(userId);
    return doc ? toApiUser(doc) : null;
  },
};
