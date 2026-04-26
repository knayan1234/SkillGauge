/**
 * v1 prompt template for generating the next interview question.
 *
 * Provider-agnostic by design — returns plain `{ system, user }` strings that any
 * LLM SDK (OpenAI, Anthropic, Ollama, …) can ship directly:
 *   - OpenAI: as `messages: [{role: "system", content: system}, {role: "user", content: user}]`
 *   - Anthropic: as `system: system, messages: [{role: "user", content: user}]`
 *
 * The renderer pulls résumé text + JD + the four setup options + a recent-answers
 * summary into the prompt, so each question is contextual to what the candidate has
 * already said. Keeps prompts deterministic in shape (variables go through the shared
 * helpers) so a future v2 can A/B against this without duplicating render logic.
 *
 * Token-budget mindfulness:
 *   - Résumé + JD are truncated to keep total input well under typical 8K context
 *     windows. The `parseResume` ingest layer guarantees `resumeContent` is plain
 *     text on the way in, so the truncation here is purely a length safeguard.
 *   - Recent-answers summary capped at 3 most recent entries (see shared.ts).
 */

import type { QuestionContext } from "../../LLMClient";
import {
  DIFFICULTY_DESCRIPTION,
  PERSONA_DESCRIPTION,
  ROLE_DESCRIPTION,
  STYLE_DESCRIPTION,
  summarizePriorAnswers,
  truncate,
} from "./shared";

export interface RenderedQuestionPrompt {
  system: string;
  user: string;
}

export function renderGenerateQuestion(
  ctx: QuestionContext,
): RenderedQuestionPrompt {
  const styleLine = STYLE_DESCRIPTION[ctx.interviewStyle];
  const difficultyLine = DIFFICULTY_DESCRIPTION[ctx.difficulty];
  const roleLine = ROLE_DESCRIPTION[ctx.roleLevel];
  const focusLine = ctx.focusAreas
    ? `Focus areas the candidate asked us to emphasise: ${truncate(ctx.focusAreas, 300)}`
    : "";
  const priorAnswers = summarizePriorAnswers(ctx.previousMessages);

  // Persona descriptor — empty string when persona is `neutral` or absent, so the
  // baseline prompt is unchanged for unflavoured sessions.
  const personaLine = PERSONA_DESCRIPTION[ctx.interviewerPersona ?? "neutral"];

  const systemParts = [
    "You are an experienced interviewer running a structured practice interview.",
    `Style: ${styleLine}.`,
    `Difficulty: ${difficultyLine}.`,
    `Candidate profile: ${roleLine}.`,
  ];
  if (personaLine) systemParts.push(personaLine);
  systemParts.push(
    "Output a single interview question — no preamble, no greeting, no commentary,",
    "no question number, no quotes. The question should stand alone and be answerable",
    "in 60-180 seconds of speech.",
  );
  const system = systemParts.join(" ");

  const round = ctx.currentRound ?? 1;
  // Round-aware framing: round 2+ means the candidate has already completed at least
  // one full round on this same résumé/JD. We instruct the model to ramp difficulty
  // and reference patterns from prior answers so the experience feels like a real
  // follow-up interview, not a reset.
  const roundFraming =
    round > 1
      ? [
          `This is round ${round} of an ongoing interview. The candidate has already completed ${round - 1} full round(s) on this same résumé and JD.`,
          "Ramp the difficulty above what was asked previously; lean on harder follow-ups, deeper system-design probes, or more nuanced behavioural scenarios.",
          "Where the prior transcript shows weak areas, weave those topics back in with sharper angles — the goal is targeted growth, not breadth.",
        ].join(" ")
      : "";

  const userParts = [
    `This is question ${ctx.questionIndex + 1} of ${ctx.totalQuestions}.`,
    "",
    "Candidate résumé (raw text):",
    truncate(ctx.resumeContent, 4000) || "(no résumé provided)",
    "",
    "Target job description:",
    truncate(ctx.jobDescription, 2000),
  ];
  if (roundFraming) {
    userParts.push("", roundFraming);
  }
  if (focusLine) {
    userParts.push("", focusLine);
  }
  if (priorAnswers) {
    userParts.push("", priorAnswers);
  }

  // Per-résumé question history — strict "do not repeat" guard. Pulled from the BE
  // messages table at call time. Truncate generously (most-recent 30 questions); the
  // ramp prompt and the priorAnswers block already carry the immediate context.
  const pastQuestions = ctx.pastQuestionsForResume ?? [];
  if (pastQuestions.length > 0) {
    const recent = pastQuestions.slice(-30);
    userParts.push(
      "",
      `IMPORTANT — questions already asked of this candidate on this résumé (DO NOT repeat or paraphrase any of these; pick a fresh angle):`,
      ...recent.map((q, i) => `${i + 1}. ${truncate(q, 200)}`),
    );
  }

  userParts.push(
    "",
    "Now produce the next question. Tailor it to the résumé and the JD; if the candidate",
    "has answered prior questions in this session, avoid repeating themes and dig deeper",
    "into areas they showed weakness or surface-level knowledge.",
  );

  const user = userParts.join("\n");

  return { system, user };
}
