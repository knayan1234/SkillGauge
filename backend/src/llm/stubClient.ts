import type {
  GradedAnswer,
  LLMClient,
  QuestionContext,
} from "./LLMClient";
import {
  renderGenerateQuestion,
  renderGradeAnswer,
} from "./prompts/v1";

// Default deterministic stub provider. Canned questions grouped by interview style +
// difficulty. The stub is intentionally deterministic so the FE can trust the branching
// before a real provider gets swapped in against this same interface.
//
// We also render the v1 prompts on every call (and discard the rendered strings) so
// that prompt-template bugs surface in CI instead of waiting for a real provider to
// hit them. If `renderGenerateQuestion(ctx)` throws — say a future enum value isn't
// covered in shared.ts — every BE test fails immediately with a clear stack trace.

const BEHAVIORAL_QUESTIONS = [
  "Tell me about yourself and your background.",
  "Why are you interested in this position?",
  "Describe a challenge you overcame at work.",
  "Tell me about a time you disagreed with a teammate and how you handled it.",
  "What's your greatest professional achievement?",
  "Where do you see yourself in 5 years?",
  "Describe a time you received tough feedback — what did you do?",
  "Tell me about a project you're most proud of.",
  "How do you handle competing priorities under a tight deadline?",
  "Walk me through a failure and what you learned.",
];

const TECHNICAL_QUESTIONS_BY_DIFFICULTY = {
  easy: [
    "Explain the difference between var, let, and const in JavaScript.",
    "What is a REST API and when would you use one?",
    "Describe how HTTP caching headers work.",
    "What is the difference between SQL and NoSQL databases?",
    "Explain what a pure function is.",
    "What is the purpose of a foreign key?",
    "Explain the difference between null and undefined.",
    "What is memoization?",
    "Describe the box model in CSS.",
    "What is the difference between GET and POST?",
  ],
  medium: [
    "Walk me through how you'd design a rate limiter.",
    "Compare eventual consistency vs strong consistency with a real example.",
    "How would you debug a slow SQL query in production?",
    "Explain the CAP theorem and how it applies to a distributed cache.",
    "Walk me through an OAuth 2.0 authorization-code flow.",
    "How does a bloom filter work and when would you use one?",
    "Explain how TCP congestion control works.",
    "Design a URL shortener — collisions, storage, scale.",
    "How would you structure retries with backoff and jitter?",
    "Compare optimistic vs pessimistic locking.",
  ],
  hard: [
    "Design a distributed job scheduler serving 1M jobs/min with at-least-once delivery.",
    "Walk me through implementing Raft consensus end-to-end.",
    "Design a multi-region active-active database — conflict resolution strategy?",
    "How would you build a real-time collaborative editor (OT vs CRDT)?",
    "Design a metrics pipeline that ingests 10M events/sec with p99 < 50ms.",
    "Explain how you'd migrate a 10TB schema change with zero downtime.",
    "How would you design an end-to-end encrypted messaging backend?",
    "Design a feed-ranking system — fan-out-on-write vs fan-out-on-read trade-offs.",
    "Walk me through implementing your own lock-free queue.",
    "Design a globally distributed rate limiter with consistent semantics.",
  ],
};

function pickQuestionBank(ctx: QuestionContext): string[] {
  if (ctx.interviewStyle === "behavioral") return BEHAVIORAL_QUESTIONS;
  if (ctx.interviewStyle === "technical") {
    return TECHNICAL_QUESTIONS_BY_DIFFICULTY[ctx.difficulty];
  }
  // mixed = interleave behavioral with technical at the configured difficulty.
  const tech = TECHNICAL_QUESTIONS_BY_DIFFICULTY[ctx.difficulty];
  const merged: string[] = [];
  const longer = Math.max(BEHAVIORAL_QUESTIONS.length, tech.length);
  for (let i = 0; i < longer; i += 1) {
    if (i < BEHAVIORAL_QUESTIONS.length) merged.push(BEHAVIORAL_QUESTIONS[i]);
    if (i < tech.length) merged.push(tech[i]);
  }
  return merged;
}

// Role-level nudges appended to technical questions — cheap way to make the stub feel
// tailored without a real LLM.
const ROLE_SUFFIX: Record<QuestionContext["roleLevel"], string> = {
  junior: "",
  mid: " Walk me through your decision points.",
  senior: " Explain the trade-offs and what you'd monitor in production.",
  lead: " How would you drive adoption and mentor the team through this?",
};

export const stubClient: LLMClient = {
  async generateQuestion(ctx: QuestionContext): Promise<string> {
    // Render the v1 prompt and discard — exercises the template path so bugs are
    // caught in CI even though the stub doesn't ship the prompt to a real provider.
    renderGenerateQuestion(ctx);

    const bank = pickQuestionBank(ctx);
    const base = bank[ctx.questionIndex % bank.length];
    const needsRoleFlavor = ctx.interviewStyle !== "behavioral";
    return needsRoleFlavor ? `${base}${ROLE_SUFFIX[ctx.roleLevel]}` : base;
  },

  async gradeAnswer(
    question: string,
    answer: string,
    ctx: QuestionContext,
  ): Promise<GradedAnswer> {
    // Render the v1 prompt and discard — exercises the template path so bugs are
    // caught in CI. Real providers also use the responseSchema returned by the
    // renderer to enforce JSON shape on the LLM response.
    renderGradeAnswer(question, answer, ctx);

    // Length proxy, scaled by difficulty so "hard" expects longer answers.
    const divisor = ctx.difficulty === "easy" ? 10 : ctx.difficulty === "hard" ? 25 : 15;
    const score = Math.min(10, Math.max(6, Math.floor(answer.length / divisor)));
    return {
      content: `Great answer! Score: ${score}/10`,
      feedback: {
        score,
        strengths: [
          "Clear communication",
          "Good structure",
          "Relevant details",
        ],
        improvements: [
          "Add more specific examples",
          "Include measurable results",
        ],
      },
    };
  },
};
