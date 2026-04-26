/**
 * Pure helpers for working with an interview transcript on the FE.
 *
 * Kept framework-free + side-effect-free so they're easy to unit-test and reuse from
 * any component (sidebar, dashboard preview, PDF export, …) without dragging React
 * imports or app-specific state along.
 */

import type { Message } from "@/services/api";

/**
 * Find which question index a given feedback message belongs to.
 *
 * Walks the transcript in order, counting `question` rows. The Nth question seen
 * before a feedback row is its parent question (questions are 0-indexed in the BE,
 * so the count-1 mapping holds).
 *
 * Returns `null` if the feedback message isn't in the transcript or there's no
 * preceding question — defensive against a corrupt transcript.
 */
export function findQuestionForFeedback(
  messages: ReadonlyArray<Message>,
  feedback: Message,
): { index: number; content: string } | null {
  const fbIdx = messages.findIndex((m) => m.id === feedback.id);
  if (fbIdx === -1) return null;

  let questionIndex = -1;
  let questionContent = "";
  for (let i = 0; i <= fbIdx; i++) {
    if (messages[i].type === "question") {
      questionIndex += 1;
      questionContent = messages[i].content;
    }
  }
  return questionIndex >= 0
    ? { index: questionIndex, content: questionContent }
    : null;
}

/**
 * Sort a transcript by createdAt ASC. Used to merge `messages` (linear flow from the
 * useSession hook) with re-answer rows that get appended out-of-band but still need
 * to slot in by their server-assigned timestamp.
 */
export function sortByTimestamp(messages: ReadonlyArray<Message>): Message[] {
  return [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
