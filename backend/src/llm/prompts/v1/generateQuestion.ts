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
 *     windows. Phase 2c will swap raw resumeContent for parsed text + chunking.
 *   - Recent-answers summary capped at 3 most recent entries (see shared.ts).
 */

import type { QuestionContext } from "../../LLMClient";
import {
  DIFFICULTY_DESCRIPTION,
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

  const system = [
    "You are an experienced interviewer running a structured practice interview.",
    `Style: ${styleLine}.`,
    `Difficulty: ${difficultyLine}.`,
    `Candidate profile: ${roleLine}.`,
    "Output a single interview question — no preamble, no greeting, no commentary,",
    "no question number, no quotes. The question should stand alone and be answerable",
    "in 60-180 seconds of speech.",
  ].join(" ");

  const userParts = [
    `This is question ${ctx.questionIndex + 1} of ${ctx.totalQuestions}.`,
    "",
    "Candidate résumé (raw text):",
    truncate(ctx.resumeContent, 4000) || "(no résumé provided)",
    "",
    "Target job description:",
    truncate(ctx.jobDescription, 2000),
  ];
  if (focusLine) {
    userParts.push("", focusLine);
  }
  if (priorAnswers) {
    userParts.push("", priorAnswers);
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
