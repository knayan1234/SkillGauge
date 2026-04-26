/**
 * createLLMClient factory tests.
 *
 * Pin down the placeholder-mode contract:
 *   - LLM_PROVIDER=stub always works (no key required).
 *   - LLM_PROVIDER=openai|anthropic without the corresponding key throws a clear,
 *     actionable error at construction time so the BE fails to BOOT instead of
 *     500-ing on the first interview request.
 *   - With the key set, the factory returns the matching adapter class.
 *
 * We mock both SDKs so the constructor calls succeed without a real network/key.
 *
 * Env handling: env.ts is parsed at module import time, so we have to set
 * process.env BEFORE re-requiring the env + factory modules. jest.resetModules()
 * lets us do that per test.
 */

jest.mock("openai", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } },
  })),
}));
jest.mock("@anthropic-ai/sdk", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() },
  })),
}));

const originalEnv = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  // Reset env to a known state before each case.
  process.env = { ...originalEnv };
  process.env.JWT_SECRET =
    "test_jwt_secret_that_is_at_least_32_characters_long_1234567890";
  process.env.NODE_ENV = "test";
});

afterAll(() => {
  process.env = originalEnv;
});

describe("createLLMClient factory", () => {
  it("returns the stubClient when LLM_PROVIDER=stub", async () => {
    process.env.LLM_PROVIDER = "stub";
    const { createLLMClient } = await import("../src/llm/index");
    const { stubClient } = await import("../src/llm/stubClient");
    expect(createLLMClient()).toBe(stubClient);
  });

  it("throws a clear error when LLM_PROVIDER=openai without OPENAI_API_KEY", async () => {
    process.env.LLM_PROVIDER = "openai";
    delete process.env.OPENAI_API_KEY;
    const { createLLMClient } = await import("../src/llm/index");
    expect(() => createLLMClient()).toThrow(/OPENAI_API_KEY is not set/);
  });

  it("throws a clear error when LLM_PROVIDER=anthropic without ANTHROPIC_API_KEY", async () => {
    process.env.LLM_PROVIDER = "anthropic";
    delete process.env.ANTHROPIC_API_KEY;
    const { createLLMClient } = await import("../src/llm/index");
    expect(() => createLLMClient()).toThrow(/ANTHROPIC_API_KEY is not set/);
  });

  it("constructs an OpenAILLMClient when LLM_PROVIDER=openai with a key set", async () => {
    process.env.LLM_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.OPENAI_MODEL = "gpt-4o-mini";
    const { createLLMClient } = await import("../src/llm/index");
    const { OpenAILLMClient } = await import("../src/llm/openaiClient");
    const client = createLLMClient();
    expect(client).toBeInstanceOf(OpenAILLMClient);
  });

  it("constructs an AnthropicLLMClient when LLM_PROVIDER=anthropic with a key set", async () => {
    process.env.LLM_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.ANTHROPIC_MODEL = "claude-sonnet-4-6";
    const { createLLMClient } = await import("../src/llm/index");
    const { AnthropicLLMClient } = await import("../src/llm/anthropicClient");
    const client = createLLMClient();
    expect(client).toBeInstanceOf(AnthropicLLMClient);
  });
});
