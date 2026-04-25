// Wire-level zod schemas for the password reset flow. Lives next to auth.schema.ts but
// stays a separate file for SRP — auth.schema is the login/register surface.
// TODO:phase-1.5e lift these into backend/src/shared/contracts.ts alongside auth + sessions.

import { z } from "zod";

// Mirrors the email validation in authSchema (trim + lowercase + email check).
// We deliberately do NOT 404 on unknown emails — that's how we prevent enumeration.
// The route returns 200 either way; this schema just normalizes input.
export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

// Plain token + new password. Token format check is loose (32-byte hex = 64 chars),
// real validation happens at the DB layer when we lookup by hash.
// Password rule mirrors authSchema's min(6); we don't *upgrade* the rule on reset
// because doing so would lock users with old short passwords out of resetting.
export const resetConfirmSchema = z.object({
  token: z.string().length(64).regex(/^[0-9a-f]{64}$/, "Invalid token format"),
  newPassword: z.string().min(6).max(128),
});

export type ResetRequest = z.infer<typeof resetRequestSchema>;
export type ResetConfirm = z.infer<typeof resetConfirmSchema>;
