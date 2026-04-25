/**
 * Zod schemas for the password-reset flow.
 *
 * These mirror backend/src/modules/auth/password.schema.ts on purpose — keeping the FE
 * and BE rules byte-aligned means a value that passes FE validation also passes BE
 * validation, so the user never gets a "wait, the form said this was OK" surprise from
 * the server. Drift here is a code smell; review every BE schema change against this
 * file in the same PR.
 *
 * Why two schemas in one file? Both belong to the password-reset feature, both share the
 * "trim+lowercase+email" shape pattern. Splitting would just add an import; co-locating
 * keeps the feature's data contract scannable in one read.
 *
 * TODO:phase-1.5e move these into backend/src/shared/contracts.ts when 1.5e lifts ALL
 * shared schemas, with the FE re-importing the inferred types from there.
 */

import { z } from "zod";

// Used by AuthModal's inline "Forgot password?" form — just an email.
export const resetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;

// Used by /reset page. Token comes from the URL ?token=... so the form only validates
// the new password. Real token validation happens at the BE on submit.
export const resetConfirmSchema = z
  .object({
    newPassword: z.string().min(6).max(128),
    confirmPassword: z.string().min(6).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type ResetConfirmFormValues = z.infer<typeof resetConfirmSchema>;
