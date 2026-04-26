/**
 * OpenAILLMClient unit tests.
 *
 * The `openai` SDK is mocked so these tests run with no network and no API key.
 * Pinning behaviour:
 *   - generateQuestion strips wrapping quotes the model occasionally adds despite
 *     prompt instructions ("Tell me about yourself" stays unquoted).
 *   - gradeAnswer parses the model's JSON response with the v1 zod schema and maps
 *     it into the LLMClient.GradedAnswer shape.
 *   - Transient errors (5xx, 408, 429, ECONN*, timeout) trigger one retry; permanent
 *     errors (4xx other than 408/429) bubble immediately.
 *   - Constructing the adapter passes timeout + apiKey + maxRetries: 0 to the SDK.
 */

import type { QuestionContext } from "../src/llm/LLMClient";

// Capture every OpenAI constructor call so we can assert wiring.
const ctorCalls: Array<Record<string, unknown>> = [];
const mockCreate = jest.fn();

jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation((opts: Record<string, unknown>) => {
      ctorCalls.push(opts);
      return {
        chat: { completions: { create: mockCreate } },
      };
    }),
  };
});

// Import AFTER jest.mock so the adapter picks up the mocked module.
import { OpenAILLMClient } from "../src/llm/openaiClient";

const baseCtx: QuestionContext = {
  questionIndex: 0,
  totalQuestions: 5,
  resumeContent: "Senior engineer with 7 years of experience.",
  jobDescription:
    "We are hiring a senior backend engineer to lead our payments team.",
  interviewStyle: "technical",
  difficulty: "medium",
  roleLevel: "senior",
  focusAreas: undefined,
  previousMessages: [],
};

beforeEach(() => {
  ctorCalls.length = 0;
  mockCreate.mockReset();
});

describe("OpenAILLMClient — construction", () => {
  it("passes apiKey, timeout, and maxRetries: 0 to the SDK", () => {
    new OpenAILLMClient({ apiKey: "sk-test", model: "gpt-4o-mini", timeoutMs: 25000 });
    expect(ctorCalls).toHaveLength(1);
    expect(ctorCalls[0]).toMatchObject({
      apiKey: "sk-test",
      timeout: 25000,
      maxRetries: 0,
    });
  });
});

describe("OpenAILLMClient.generateQuestion", () => {
  it("returns the model's content with wrapping quotes stripped", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: '"Tell me about yourself."' } }],
    });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    const result = await client.generateQuestion(baseCtx);
    expect(result).toBe("Tell me about yourself.");
  });

  it("ships system + user messages and uses the configured model", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "Q?" } }],
    });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-2024-11-20",
      timeoutMs: 30000,
    });
    await client.generateQuestion(baseCtx);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const arg = mockCreate.mock.calls[0][0] as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(arg.model).toBe("gpt-4o-2024-11-20");
    expect(arg.messages).toHaveLength(2);
    expect(arg.messages[0].role).toBe("system");
    expect(arg.messages[1].role).toBe("user");
    // The prompt renderer should have interpolated the JD into the user message.
    expect(arg.messages[1].content).toContain("payments team");
  });
});

describe("OpenAILLMClient.gradeAnswer", () => {
  it("parses the JSON response with the v1 zod schema and returns a GradedAnswer", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              content: "Strong answer with concrete examples.",
              score: 8,
              strengths: ["Clear structure", "Good trade-off discussion"],
              improvements: ["Mention monitoring"],
            }),
          },
        },
      ],
    });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    const result = await client.gradeAnswer("Q?", "A.", baseCtx);
    expect(result.feedback.score).toBe(8);
    expect(result.feedback.strengths).toContain("Clear structure");
    expect(result.content).toMatch(/Strong answer/);
  });

  it("requests JSON-mode response_format on grading calls", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              content: "ok",
              score: 6,
              strengths: ["a"],
              improvements: [],
            }),
          },
        },
      ],
    });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    await client.gradeAnswer("Q?", "A.", baseCtx);
    const arg = mockCreate.mock.calls[0][0] as {
      response_format: { type: string };
    };
    expect(arg.response_format).toEqual({ type: "json_object" });
  });

  it("throws on a malformed JSON response (zod schema rejects it)", async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              content: "ok",
              score: 999, // out of range — schema rejects
              strengths: ["a"],
              improvements: [],
            }),
          },
        },
      ],
    });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    await expect(client.gradeAnswer("Q?", "A.", baseCtx)).rejects.toThrow();
  });
});

describe("OpenAILLMClient — retry semantics", () => {
  it("retries once on a 503 (transient) and succeeds on the second attempt", async () => {
    const transient = Object.assign(new Error("Service Unavailable"), { status: 503 });
    mockCreate
      .mockRejectedValueOnce(transient)
      .mockResolvedValueOnce({ choices: [{ message: { content: "Q?" } }] });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    const result = await client.generateQuestion(baseCtx);
    expect(result).toBe("Q?");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry on a 401 (permanent — bad API key)", async () => {
    const permanent = Object.assign(new Error("Unauthorized"), { status: 401 });
    mockCreate.mockRejectedValueOnce(permanent);
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    await expect(client.generateQuestion(baseCtx)).rejects.toThrow("Unauthorized");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("retries once on ECONNRESET", async () => {
    const networkErr = new Error("read ECONNRESET");
    mockCreate
      .mockRejectedValueOnce(networkErr)
      .mockResolvedValueOnce({ choices: [{ message: { content: "Q?" } }] });
    const client = new OpenAILLMClient({
      apiKey: "k",
      model: "gpt-4o-mini",
      timeoutMs: 30000,
    });
    await client.generateQuestion(baseCtx);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
