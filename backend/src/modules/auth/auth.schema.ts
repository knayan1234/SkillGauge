import { z } from "zod";

// Mirrors web/features/auth/authSchema.ts exactly. Shapes must stay in sync — if they drift,
// the FE form can submit values the BE rejects (or vice versa). Keep diff-checkable.
export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(128),
});

export type Credentials = z.infer<typeof credentialsSchema>;
