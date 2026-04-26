/**
 * AnthropicLLMClient unit tests.
 *
 * The `@anthropic-ai/sdk` is mocked so these tests run with no network and no API key.
 * Pinning behaviour:
 *   - generateQuestion reads the first text block from messages.create() and strips
 *     wrapping quotes.
 *   - gradeAnswer extracts the tool_use block (forced via tool_choice) and validates
 *     its `input` field with the v1 gradeResponseSchema before mapping to GradedAnswer.
 *   - Same retry semantics as the OpenAI adapter (one retry on 5xx/408/429/network).
 *   - Construction passes apiKey + timeout + maxRetries: 0.
 */

import type { QuestionContext } from "../src/llm/LLMClient";

const ctorCalls: Array<Record<string, unknown>> = [];
const mockCreate = jest.fn();

jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((opts: Record<string, unknown>) => {
      ctorCalls.push(opts);
      return {
        messages: { create: mockCreate },
      };
    }),
  };
});

import { AnthropicLLMClient } from "../src/llm/anthropicClient";

const baseCtx: QuestionContext = {
  questionIndex: 1,
  totalQuestions: 5,
  resumeContent: "Mid-level engineer with 4 years experience.",
  jobDescription:
    "Hiring a backend engineer to own our distributed task queue.",
  interviewStyle: "mixed",
  difficulty: "medium",
  roleLevel: "mid",
  focusAreas: undefined,
  previousMessages: [],
};

beforeEach(() => {
  ctorCalls.length = 0;
  mockCreate.mockReset();
});

describe("AnthropicLLMClient — construction", () => {
  it("passes apiKey, timeout, and maxRetries: 0 to the SDK", () => {
    new AnthropicLLMClient({
      apiKey: "sk-ant-test",
      model: "claude-sonnet-4-6",
      timeoutMs: 25000,
    });
    expect(ctorCalls).toHaveLength(1);
    expect(ctorCalls[0]).toMatchObject({
      apiKey: "sk-ant-test",
      timeout: 25000,
      maxRetries: 0,
    });
  });
});

describe("AnthropicLLMClient.generateQuestion", () => {
  it("returns the first text-block content with wrapping quotes stripped", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: '"What is your experience with queues?"' }],
    });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    const result = await client.generateQuestion(baseCtx);
    expect(result).toBe("What is your experience with queues?");
  });

  it("ships system at top level (Anthropic shape) plus a user message", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "Q?" }],
    });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    await client.generateQuestion(baseCtx);
    const arg = mockCreate.mock.calls[0][0] as {
      model: string;
      max_tokens: number;
      system: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(arg.model).toBe("claude-sonnet-4-6");
    expect(typeof arg.system).toBe("string");
    expect(arg.system.length).toBeGreaterThan(20);
    expect(arg.messages).toHaveLength(1);
    expect(arg.messages[0].role).toBe("user");
    expect(arg.messages[0].content).toContain("distributed task queue");
    expect(arg.max_tokens).toBeGreaterThan(0);
  });

  it("returns empty string when the model returns a non-text first block", async () => {
    // Defensive — if Claude ever returns only tool_use or thinking blocks here, we
    // shouldn't crash; the caller persists the empty string and moves on.
    mockCreate.mockResolvedValueOnce({ content: [] });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    expect(await client.generateQuestion(baseCtx)).toBe("");
  });
});

describe("AnthropicLLMClient.gradeAnswer", () => {
  it("extracts the tool_use input and parses it with the v1 zod schema", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "submit_grade",
          input: {
            content: "Solid answer with concrete examples.",
            score: 7,
            strengths: ["Clear structure"],
            improvements: ["Discuss failure modes"],
          },
        },
      ],
    });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    const result = await client.gradeAnswer("Q?", "A.", baseCtx);
    expect(result.feedback.score).toBe(7);
    expect(result.feedback.strengths).toContain("Clear structure");
    expect(result.content).toMatch(/Solid answer/);
  });

  it("requests the submit_grade tool with tool_choice forcing its use", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "submit_grade",
          input: {
            content: "ok",
            score: 6,
            strengths: ["a"],
            improvements: [],
          },
        },
      ],
    });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    await client.gradeAnswer("Q?", "A.", baseCtx);
    const arg = mockCreate.mock.calls[0][0] as {
      tools: Array<{ name: string; input_schema: unknown }>;
      tool_choice: { type: string; name: string };
    };
    expect(arg.tools).toHaveLength(1);
    expect(arg.tools[0].name).toBe("submit_grade");
    expect(arg.tool_choice).toEqual({ type: "tool", name: "submit_grade" });
  });

  it("throws when no tool_use block is returned (defensive — malformed Claude response)", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [{ type: "text", text: "I think the answer is..." }],
    });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    await expect(client.gradeAnswer("Q?", "A.", baseCtx)).rejects.toThrow(
      /grading tool call/i,
    );
  });

  it("throws when tool_use input fails the zod schema (out-of-range score)", async () => {
    mockCreate.mockResolvedValueOnce({
      content: [
        {
          type: "tool_use",
          name: "submit_grade",
          input: {
            content: "ok",
            score: 99, // out of range
            strengths: ["a"],
            improvements: [],
          },
        },
      ],
    });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    await expect(client.gradeAnswer("Q?", "A.", baseCtx)).rejects.toThrow();
  });
});

describe("AnthropicLLMClient — retry semantics", () => {
  it("retries once on a 503 then succeeds", async () => {
    const transient = Object.assign(new Error("Server overloaded"), {
      status: 503,
    });
    mockCreate
      .mockRejectedValueOnce(transient)
      .mockResolvedValueOnce({
        content: [{ type: "text", text: "Q?" }],
      });
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    const result = await client.generateQuestion(baseCtx);
    expect(result).toBe("Q?");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on a 401 (permanent — bad API key)", async () => {
    const permanent = Object.assign(new Error("Unauthorized"), { status: 401 });
    mockCreate.mockRejectedValueOnce(permanent);
    const client = new AnthropicLLMClient({
      apiKey: "k",
      model: "claude-sonnet-4-6",
      timeoutMs: 30000,
    });
    await expect(client.generateQuestion(baseCtx)).rejects.toThrow("Unauthorized");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
