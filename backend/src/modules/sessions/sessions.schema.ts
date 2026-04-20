import { z } from "zod";

export const INTERVIEW_STYLES = ["behavioral", "technical", "mixed"] as const;
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export const ROLE_LEVELS = ["junior", "mid", "senior", "lead"] as const;
export const QUESTION_COUNTS = [3, 5, 7, 10] as const;

export type InterviewStyle = (typeof INTERVIEW_STYLES)[number];
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
export type RoleLevel = (typeof ROLE_LEVELS)[number];

// Mirrors web/features/session-setup/sessionSetupSchema.ts for the *payload shape*.
// File validation (size, MIME, single-file) stays on the FE — the server receives a base64 text
// representation of the resume in Phase 1 to keep the surface simple. Phase 4 will add multipart
// upload + real parsing; the `resumeContent` field becomes an opaque blob reference then.
export const initSessionSchema = z.object({
  resumeFileName: z.string().min(1).max(255),
  resumeContent: z.string().min(1).max(10_000_000), // ~10MB cap as a soft DoS guard
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

export const answerSchema = z.object({
  answer: z.string().trim().min(1).max(10_000),
});

export type InitSessionPayload = z.infer<typeof initSessionSchema>;
export type AnswerPayload = z.infer<typeof answerSchema>;
