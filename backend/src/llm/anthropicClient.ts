/**
 * Anthropic adapter implementing the project-wide LLMClient interface.
 *
 * Mirrors `OpenAILLMClient` structurally — both adapters consume the SAME v1 prompt
 * renderers and produce the SAME `LLMClient` shape. The only difference is the SDK
 * mapping: Anthropic takes `system` as a top-level parameter (not as a message), and
 * structured-output is via tool calls rather than JSON-mode.
 *
 * Construction: caller passes API key + model + timeout. Factory in `index.ts` enforces
 * "key required when provider=anthropic"; a missing key fails the process at boot.
 *
 * Structured grading output: Claude doesn't have OpenAI's `response_format: json_object`
 * mode; instead we ask the model to return a tool call against a function whose schema
 * matches our `gradeResponseSchema`. That gets us the same shape guarantee with
 * Claude-native semantics. We then `.parse()` the tool input with our zod schema so a
 * malformed payload still fails loudly.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Message, Tool } from "@anthropic-ai/sdk/resources/messages";
import type {
  GradedAnswer,
  LLMClient,
  QuestionContext,
} from "./LLMClient";
import {
  renderGenerateQuestion,
  renderGradeAnswer,
} from "./prompts/v1";

interface AnthropicClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

// Tool schema fed to Claude so it returns grading via a structured tool call. Mirrors
// the gradeResponseSchema zod shape (1-10 score, strengths/improvements arrays). The
// model picks this tool by name; we extract its input as the grading JSON.
//
// Typed as `Tool` (not `as const`) because the SDK expects mutable arrays for
// `input_schema.required`, and `as const` would make those readonly.
const GRADE_TOOL_SCHEMA: Tool = {
  name: "submit_grade",
  description:
    "Submit a grade for the candidate's answer using the project's rubric.",
  input_schema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "1-2 sentence summary of the answer's quality.",
      },
      score: {
        type: "integer",
        minimum: 1,
        maximum: 10,
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
      },
      improvements: {
        type: "array",
        items: { type: "string" },
        minItems: 0,
        maxItems: 5,
      },
    },
    required: ["content", "score", "strengths", "improvements"],
  },
};

export class AnthropicLLMClient implements LLMClient {
  private readonly sdk: Anthropic;
  private readonly model: string;

  constructor(opts: AnthropicClientOptions) {
    this.sdk = new Anthropic({
      apiKey: opts.apiKey,
      timeout: opts.timeoutMs,
      maxRetries: 0,
    });
    this.model = opts.model;
  }

  async generateQuestion(ctx: QuestionContext): Promise<string> {
    const { system, user } = renderGenerateQuestion(ctx);
    const message: Message = await this.callWithRetry(() =>
      this.sdk.messages.create({
        model: this.model,
        // Claude needs a max_tokens cap on every request. 600 is generous for a single
        // question (typical interview question is ≤ 100 tokens).
        max_tokens: 600,
        system,
        messages: [{ role: "user", content: user }],
      }),
    );
    // Claude returns content as an array of blocks; for a plain text response it's a
    // single text block. Strip wrapping quotes some models add despite instructions.
    const block = message.content[0];
    if (!block || block.type !== "text") return "";
    return block.text.trim().replace(/^"|"$/g, "");
  }

  async gradeAnswer(
    question: string,
    answer: string,
    ctx: QuestionContext,
  ): Promise<GradedAnswer> {
    const { system, user, responseSchema } = renderGradeAnswer(
      question,
      answer,
      ctx,
    );
    const message: Message = await this.callWithRetry(() =>
      this.sdk.messages.create({
        model: this.model,
        max_tokens: 1000, // grading needs more tokens than question generation
        system,
        messages: [{ role: "user", content: user }],
        // tools + tool_choice forces Claude to call our grading tool with a structured
        // payload matching GRADE_TOOL_SCHEMA. The response comes back as a tool_use
        // content block, not as plain text.
        tools: [GRADE_TOOL_SCHEMA],
        tool_choice: { type: "tool", name: GRADE_TOOL_SCHEMA.name },
      }),
    );
    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(
        "Anthropic response did not include the expected grading tool call.",
      );
    }
    const validated = responseSchema.parse(toolUse.input);
    return {
      content: validated.content,
      feedback: {
        score: validated.score,
        strengths: validated.strengths,
        improvements: validated.improvements,
      },
    };
  }

  /** One transient-failure retry. Same policy as OpenAILLMClient. */
  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err)) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await fn();
    }
  }
}

function isTransient(err: unknown): boolean {
  if (err instanceof Error) {
    if (
      err.message.includes("ECONN") ||
      err.message.includes("ETIMEDOUT") ||
      err.message.includes("timeout")
    ) {
      return true;
    }
  }
  const status = (err as { status?: number } | null)?.status;
  if (typeof status === "number" && (status >= 500 || status === 408 || status === 429)) {
    return true;
  }
  return false;
}
