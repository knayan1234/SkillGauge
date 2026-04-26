import { z } from "zod";

export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Paired with ACCEPTED_RESUME_TYPES — the HTML file picker needs extensions, the zod refine
// needs MIME types. Both lists must change together; keep them neighbors here.
export const ACCEPTED_RESUME_ACCEPT_ATTR = ".pdf,.doc,.docx";

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

// Enums kept as tuples so zod + TS literal unions stay in sync with the UI option lists.
export const INTERVIEW_STYLES = ["behavioral", "technical", "mixed"] as const;
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;
export const ROLE_LEVELS = ["junior", "mid", "senior", "lead"] as const;
// Persona modes — tilts the interviewer's tone + rubric. `neutral` is the default
// and produces the unflavoured baseline prompt.
export const INTERVIEWER_PERSONAS = [
  "neutral",
  "faang",
  "startup",
  "consulting",
] as const;
// 25 is the canonical "per-round" count for the round-chaining flow. Smaller values
// stay supported for quick warm-up runs.
export const QUESTION_COUNTS = [3, 5, 7, 10, 25] as const;

// `InterviewStyle`, `DifficultyLevel`, `RoleLevel`, and `InterviewerPersona` are the
// canonical shape — but consumers import them from services/api.ts where they're
// declared as part of the wire contract, so we don't re-export them here.
export type QuestionCount = (typeof QUESTION_COUNTS)[number];

// Duck-typed check instead of `instanceof FileList` — jsdom 29 lacks DataTransfer, so tests
// can't build a real FileList. ArrayLike<File> works in both the browser and test environments.
function isFileListLike(val: unknown): val is ArrayLike<File> {
  return (
    typeof val === "object" &&
    val !== null &&
    "length" in (val as Record<string, unknown>) &&
    typeof (val as ArrayLike<unknown>).length === "number"
  );
}

export const sessionSetupSchema = z.object({
  resume: z
    .custom<FileList>(isFileListLike, { message: "Attach a resume file" })
    .refine(
      (files) => files.length === 1,
      "Attach exactly one resume file",
    )
    .refine(
      (files) => files[0] instanceof File && files[0].size <= MAX_RESUME_BYTES,
      "Resume must be 5MB or smaller",
    )
    .refine(
      (files) =>
        files[0] instanceof File &&
        ACCEPTED_RESUME_TYPES.includes(files[0].type),
      "Only PDF or Word documents are supported",
    ),
  jobDescription: z
    .string()
    .trim()
    .min(50, "Paste at least 50 characters of the job description")
    .max(10_000, "Job description is too long"),
  interviewStyle: z.enum(INTERVIEW_STYLES),
  difficulty: z.enum(DIFFICULTY_LEVELS),
  roleLevel: z.enum(ROLE_LEVELS),
  // Native <select> returns string values; union-of-literals keeps RHF's input type clean
  // while the transform hands a properly narrowed number to consumers.
  questionCount: z
    .enum(QUESTION_COUNTS.map(String) as unknown as [string, ...string[]])
    .transform((v) => Number(v) as QuestionCount),
  focusAreas: z.string().trim().max(500).optional().or(z.literal("")),
  // Persona is optional with a default — the dropdown is pre-selected to "neutral",
  // so users who never touch it submit with the safe default and the backend keeps
  // its pre-Phase-10 behaviour.
  interviewerPersona: z.enum(INTERVIEWER_PERSONAS).default("neutral"),
});

// Input type (what RHF holds before submit) vs output type (post-transform values).
export type SessionSetupFormInput = z.input<typeof sessionSetupSchema>;
export type SessionSetupFormValues = z.output<typeof sessionSetupSchema>;
