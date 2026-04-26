/**
 * v1 prompt set — barrel export.
 *
 * Versioning rationale:
 *   - Every question + feedback message persists `promptVersion` so analytics can compare
 *     answer scores across prompt revisions ("did v2 actually grade harder than v1?").
 *   - Adapters import from this barrel, never from the individual files. That way a
 *     future v2 just adds `prompts/v2/index.ts` with the same shape and adapters can
 *     swap by changing one import line.
 *
 * What ships in v1:
 *   - renderGenerateQuestion(ctx) → { system, user }
 *   - renderGradeAnswer(question, answer, ctx) → { system, user, responseSchema }
 *   - PROMPT_VERSION constant (recorded on every message)
 */

export const PROMPT_VERSION = "v1" as const;
export type PromptVersion = typeof PROMPT_VERSION;

export { renderGenerateQuestion } from "./generateQuestion";
export type { RenderedQuestionPrompt } from "./generateQuestion";
export {
  renderGradeAnswer,
  gradeResponseSchema,
} from "./gradeAnswer";
export type { GradeResponse, RenderedGradePrompt } from "./gradeAnswer";
