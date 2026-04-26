/**
 * Shared helpers for the v1 prompt templates.
 *
 * The interview-style / difficulty / role-level enums all need consistent prose mappings
 * when we render prompts. Centralising those mappings in one place means a future v2
 * prompt set can re-use them or diverge intentionally — without ad-hoc strings drifting
 * across multiple template files.
 *
 * No runtime logic here beyond plain string lookups and a small formatting helper.
 */

import type {
  DifficultyLevel,
  InterviewStyle,
  RoleLevel,
} from "@/shared/types";

/**
 * Human-readable role label used in the rendered system prompt. Keeps the LLM's mental
 * model of the candidate aligned with what the user picked in the setup form. We use
 * "lead" for tech-lead / staff to keep the surface small; the prompt description does the
 * disambiguating.
 */
export const ROLE_DESCRIPTION: Record<RoleLevel, string> = {
  junior: "an early-career engineer with 0-2 years of professional experience",
  mid: "a mid-level engineer with 2-5 years of experience",
  senior: "a senior engineer with 5-10 years of experience",
  lead: "a tech lead or staff engineer expected to mentor others and own roadmap decisions",
};

/**
 * Difficulty modifier injected into the question prompt. Drives how much depth the
 * interviewer should expect; not a temperature setting (real adapters will wire that
 * separately at the SDK call site).
 */
export const DIFFICULTY_DESCRIPTION: Record<DifficultyLevel, string> = {
  easy: "warm-up calibre — surface-level knowledge checks",
  medium: "standard interview calibre — expect explanations and trade-offs",
  hard: "deep technical / leadership probe — expect designs, edge cases, and production concerns",
};

/**
 * Interview style descriptor used to bias the LLM toward behavioral, technical, or
 * mixed questions. The "mixed" mode tells the LLM to alternate; the actual ordering
 * is server-controlled via questionIndex so the conversation feels predictable.
 */
export const STYLE_DESCRIPTION: Record<InterviewStyle, string> = {
  behavioral:
    "behavioral / situational — focus on past experiences, decisions, and collaboration",
  technical: "technical — focus on engineering knowledge and problem-solving",
  mixed:
    "mixed — alternate behavioral and technical questions, biased toward the difficulty selected",
};

/**
 * Compact summary of recent answers to feed back into the next question prompt.
 * We deliberately drop pure-question entries (the LLM produced them; no signal) and
 * cap the most-recent N answers to keep prompts small. Returns an empty string when
 * there's nothing to include — callers append it conditionally.
 */
export function summarizePriorAnswers(
  history: ReadonlyArray<{ type: "question" | "answer" | "feedback"; content: string }>,
  maxAnswers = 3,
): string {
  const answers = history
    .filter((m) => m.type === "answer")
    .slice(-maxAnswers)
    .map((m, idx) => `(${idx + 1}) ${truncate(m.content, 400)}`);
  if (answers.length === 0) return "";
  return ["Recent answers from this session:", ...answers].join("\n");
}

/**
 * Truncate a string to N characters with a single-character ellipsis. Avoids smart-quote
 * surprises in prompts; some providers tokenise "…" oddly.
 */
export function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
