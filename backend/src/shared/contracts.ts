/**
 * Single source of truth for every wire-level zod schema in SkillGauge.
 *
 * Why this file exists:
 *   1. Without it, schemas would be scattered across `modules/auth/auth.schema.ts`,
 *      `modules/auth/password.schema.ts`, and `modules/sessions/sessions.schema.ts`.
 *      Multiple sources of truth = drift risk between routes and tests.
 *   2. The FE [services/api.ts](web/services/api.ts) mirrors these shapes by hand. With
 *      one BE file as canon, the FE diff-check becomes a single search.
 *   3. Adapter tests (e.g. mocking session creation against the real schema) reuse these,
 *      so consumers don't have to chase imports.
 *
 * Convention: every schema gets a `*Schema` zod export AND an inferred type alias.
 *
 * What this file does NOT hold:
 *   - Storage shapes (`UserDoc`, `SessionDoc`, `MessageDoc`, etc.) — those live in
 *     `db/repos/*.ts` next to the queries that use them. The wire contract and the
 *     storage shape are different concerns even when they look similar.
 *   - Service-layer DTOs (`AuthResult`, `SessionInitRequest` from shared/types) — those
 *     are TypeScript-only contracts between layers, not validated payloads.
 */

import { z } from "zod";

// --------------------------------------------------------------------------------------
// Auth — credentials (login + register)
// --------------------------------------------------------------------------------------

// Mirrors web/features/auth/authSchema.ts. Trim + lowercase the email so casing
// differences ("Alice@…" vs "alice@…") collapse to one row in the users collection.
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
});
export type Credentials = z.infer<typeof credentialsSchema>;

// --------------------------------------------------------------------------------------
// Auth — password reset (request + confirm)
// --------------------------------------------------------------------------------------

// Used by AuthModal's inline "Forgot password?" form on the FE.
// We deliberately do NOT 404 on unknown emails at the route layer — the response is
// always opaque 200, regardless of registration. This schema only normalizes input.
export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ResetRequest = z.infer<typeof resetRequestSchema>;

// Token format: 64 hex chars (32 random bytes). Real validation happens at the DB layer
// when we look up by SHA-256 hash.
// Password rule mirrors `credentialsSchema`'s min(6); we don't *upgrade* the rule on
// reset because that would lock users with old short passwords out of resetting.
export const resetConfirmSchema = z.object({
  token: z.string().length(64).regex(/^[0-9a-f]{64}$/, "Invalid token format"),
  newPassword: z.string().min(6).max(128),
});
export type ResetConfirm = z.infer<typeof resetConfirmSchema>;

// --------------------------------------------------------------------------------------
// Sessions — interview setup + answer submission
// --------------------------------------------------------------------------------------

// Enums: stored on the session doc and threaded into the LLM context so prompts can
// branch by style/difficulty/role. Tuples (`as const`) so the inferred zod enum types
// stay narrow.
export const INTERVIEW_STYLES = ["behavioral", "technical", "mixed"] as const;
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export const ROLE_LEVELS = ["junior", "mid", "senior", "lead"] as const;
export const QUESTION_COUNTS = [3, 5, 7, 10] as const;

export type InterviewStyle = (typeof INTERVIEW_STYLES)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
export type RoleLevel = (typeof ROLE_LEVELS)[number];

// Mirrors web/features/session-setup/sessionSetupSchema.ts for the *payload shape* (NOT
// the file-validation rules — those stay on the FE because the BE never sees the raw
// File object, only the base64-encoded bytes).
//
// `resumeContent` carries the raw file as a base64 string; `resumeMime` tells the BE
// which parser to dispatch to (pdf-parse for PDFs, mammoth for .docx, plain UTF-8 for
// text/*). 10MB cap on the base64 string is a soft DoS guard; FE already validates
// ≤5MB at the input layer (base64 inflates ~33% so 10MB encoded ~= 7.5MB raw).
export const initSessionSchema = z.object({
  resumeFileName: z.string().min(1).max(255),
  resumeContent: z.string().min(1).max(10_000_000),
  // MIME from the browser's File.type. Validated as a non-empty string only — the
  // ingest layer enforces "supported MIME" semantics with structured error codes.
  resumeMime: z.string().min(1).max(255),
  jobDescription: z.string().trim().min(50).max(10_000),
  interviewStyle: z.enum(INTERVIEW_STYLES),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  roleLevel: z.enum(ROLE_LEVELS),
  questionCount: z
    .number()
    .int()
    .refine((n) => (QUESTION_COUNTS as readonly number[]).includes(n), {
      message: "Unsupported question count",
    }),
  focusAreas: z.string().trim().max(500).optional(),
});
export type InitSessionPayload = z.infer<typeof initSessionSchema>;

// Submit-answer body. Plain text only. Length bounds prevent both empty submissions
// and abusive 1MB blobs that would burn LLM budget for no signal.
export const answerSchema = z.object({
  answer: z.string().trim().min(1).max(10_000),
});
export type AnswerPayload = z.infer<typeof answerSchema>;
