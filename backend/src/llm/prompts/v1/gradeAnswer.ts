/**
 * v1 prompt template for grading an answer to an interview question.
 *
 * Returns:
 *   - `system` — interviewer-evaluator persona + scoring rubric
 *   - `user` — the question, the candidate's answer, plus contextual setup options
 *   - `responseSchema` — zod schema enforcing the JSON shape the LLM must return.
 *     Real adapters wire this as OpenAI `response_format: { type: "json_schema" }` or
 *     as an Anthropic tool-call schema; our consumer (`sessions.service.ts`) parses
 *     the response with `responseSchema.parse(...)` before persisting, so a malformed
 *     LLM response fails fast instead of polluting the messages collection.
 *
 * The scoring rubric is deliberately concrete (1-10 scale with anchor descriptions)
 * so different LLMs converge on similar scores. Strengths + improvements are arrays
 * of short bullets — easy to render in the FE feedback bubble without further
 * post-processing.
 */

import { z } from "zod";
import type { QuestionContext } from "../../LLMClient";
import {
  DIFFICULTY_DESCRIPTION,
  ROLE_DESCRIPTION,
  STYLE_DESCRIPTION,
  truncate,
} from "./shared";

export interface RenderedGradePrompt {
  system: string;
  user: string;
  responseSchema: typeof gradeResponseSchema;
}

/**
 * Wire shape the LLM must emit. Mirrors the existing `Feedback` interface in
 * @/shared/types so we can persist directly without re-mapping fields.
 *   - score: integer 1-10 (anchored: <=4 "needs significant work", 5-7 "solid",
 *     8-10 "exceptional"). Bounded so the FE feedback widget doesn't have to
 *     handle out-of-range values.
 *   - strengths / improvements: 1-5 short bullets each, capped to keep the
 *     feedback panel scannable.
 *   - content: 1-2 sentence summary shown above the bullets.
 */
export const gradeResponseSchema = z.object({
  content: z.string().min(1).max(500),
  score: z.number().int().min(1).max(10),
  strengths: z.array(z.string().min(1).max(200)).min(1).max(5),
  improvements: z.array(z.string().min(1).max(200)).min(0).max(5),
});
export type GradeResponse = z.infer<typeof gradeResponseSchema>;

export function renderGradeAnswer(
  question: string,
  answer: string,
  ctx: QuestionContext,
): RenderedGradePrompt {
  const styleLine = STYLE_DESCRIPTION[ctx.interviewStyle];
  const difficultyLine = DIFFICULTY_DESCRIPTION[ctx.difficulty];
  const roleLine = ROLE_DESCRIPTION[ctx.roleLevel];

  const system = [
    "You are an experienced interview coach evaluating a candidate's answer.",
    `Interview style: ${styleLine}.`,
    `Difficulty calibration: ${difficultyLine}.`,
    `Candidate profile: ${roleLine}.`,
    "Score on a 1-10 integer scale:",
    "  1-4 — significant gaps; misunderstood or skipped key parts of the question.",
    "  5-7 — solid; correct but could go deeper or be more specific.",
    "  8-10 — exceptional; demonstrates deep understanding, real examples, trade-offs.",
    "",
    "Return ONLY a JSON object matching this exact shape (no prose, no markdown fences):",
    '  { "content": <1-2 sentence summary>, "score": <int 1-10>,',
    '    "strengths": [<short bullet>, ...], "improvements": [<short bullet>, ...] }',
    "Strengths must have at least one entry. Improvements may be empty for top-tier answers.",
    "Each bullet should be a single sentence (<200 chars).",
  ].join("\n");

  const user = [
    "Question:",
    truncate(question, 1000),
    "",
    "Candidate's answer:",
    truncate(answer, 4000),
    "",
    "Now grade this answer per the rubric and return the JSON.",
  ].join("\n");

  return { system, user, responseSchema: gradeResponseSchema };
}
