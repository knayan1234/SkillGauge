/**
 * v1 prompt template tests.
 *
 * Pin down:
 *   - PROMPT_VERSION is "v1" (anything storing this on a message must use the export)
 *   - renderGenerateQuestion produces non-empty system + user with key context fields
 *     interpolated (résumé, JD, role label, difficulty)
 *   - renderGradeAnswer produces a system + user + a usable responseSchema
 *   - gradeResponseSchema rejects out-of-bounds scores and empty strengths
 *   - Recent-answers summary is included only when prior answers exist
 *
 * No mocks needed — these are pure functions over plain inputs.
 */

import {
  PROMPT_VERSION,
  gradeResponseSchema,
  renderGenerateQuestion,
  renderGradeAnswer,
} from "../src/llm/prompts/v1";
import type { QuestionContext } from "../src/llm/LLMClient";

const baseCtx: QuestionContext = {
  questionIndex: 0,
  totalQuestions: 5,
  resumeContent:
    "Jane Doe — Senior Software Engineer with 7 years of experience in distributed systems.",
  jobDescription:
    "We are hiring a senior backend engineer to lead our payments platform team.",
  interviewStyle: "mixed",
  difficulty: "medium",
  roleLevel: "senior",
  focusAreas: undefined,
  previousMessages: [],
};

describe("PROMPT_VERSION", () => {
  it("is 'v1' so persisted messages tag the right template revision", () => {
    expect(PROMPT_VERSION).toBe("v1");
  });
});

describe("renderGenerateQuestion (v1)", () => {
  it("produces non-empty system + user prompts", () => {
    const out = renderGenerateQuestion(baseCtx);
    expect(out.system.length).toBeGreaterThan(50);
    expect(out.user.length).toBeGreaterThan(50);
  });

  it("interpolates the résumé, JD, role label, and difficulty into the user prompt", () => {
    const out = renderGenerateQuestion(baseCtx);
    expect(out.user).toContain("Jane Doe");
    expect(out.user).toContain("payments platform");
    // Role + difficulty descriptors live in shared.ts — check we ship them through.
    expect(out.system).toMatch(/senior engineer/i);
    expect(out.system).toMatch(/standard interview calibre/i);
  });

  it("includes a 'recent answers' summary only when prior answers exist", () => {
    const withoutAnswers = renderGenerateQuestion(baseCtx);
    expect(withoutAnswers.user).not.toMatch(/Recent answers/);

    const withAnswers = renderGenerateQuestion({
      ...baseCtx,
      previousMessages: [
        { type: "question", content: "Q1?" },
        { type: "answer", content: "I led a project that scaled..." },
        { type: "feedback", content: "Solid." },
      ],
    });
    expect(withAnswers.user).toMatch(/Recent answers/);
    expect(withAnswers.user).toMatch(/I led a project/);
  });

  it("includes focus areas when provided", () => {
    const out = renderGenerateQuestion({
      ...baseCtx,
      focusAreas: "system design and concurrency",
    });
    expect(out.user).toMatch(/system design and concurrency/i);
  });

  it("instructs the model to output a single bare question (no preamble)", () => {
    const out = renderGenerateQuestion(baseCtx);
    expect(out.system.toLowerCase()).toMatch(/no preamble|stand alone|single interview question/i);
  });
});

describe("renderGradeAnswer (v1)", () => {
  it("produces non-empty prompts and a usable responseSchema", () => {
    const out = renderGradeAnswer(
      "What is a bloom filter and when would you use one?",
      "A bloom filter is a probabilistic data structure for set membership tests...",
      baseCtx,
    );
    expect(out.system.length).toBeGreaterThan(50);
    expect(out.user.length).toBeGreaterThan(50);
    expect(out.responseSchema).toBeDefined();
    // The exported singleton schema is the same one consumers will use.
    expect(out.responseSchema).toBe(gradeResponseSchema);
  });

  it("instructs the model to return a strict JSON shape (no markdown fences)", () => {
    const out = renderGradeAnswer("Q?", "A.", baseCtx);
    expect(out.system).toMatch(/JSON object/i);
    expect(out.system).toMatch(/no markdown/i);
  });
});

describe("gradeResponseSchema validation", () => {
  it("accepts a well-formed grading payload", () => {
    const ok = gradeResponseSchema.safeParse({
      content: "Strong answer with concrete examples.",
      score: 8,
      strengths: ["Clear structure", "Good trade-off discussion"],
      improvements: ["Mention monitoring"],
    });
    expect(ok.success).toBe(true);
  });

  it("rejects scores outside 1-10", () => {
    const tooHigh = gradeResponseSchema.safeParse({
      content: "ok",
      score: 11,
      strengths: ["a"],
      improvements: [],
    });
    expect(tooHigh.success).toBe(false);

    const tooLow = gradeResponseSchema.safeParse({
      content: "ok",
      score: 0,
      strengths: ["a"],
      improvements: [],
    });
    expect(tooLow.success).toBe(false);
  });

  it("rejects an empty strengths array (must include at least one)", () => {
    const res = gradeResponseSchema.safeParse({
      content: "ok",
      score: 5,
      strengths: [],
      improvements: [],
    });
    expect(res.success).toBe(false);
  });
});
