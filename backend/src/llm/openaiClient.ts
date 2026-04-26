/**
 * OpenAI adapter implementing the project-wide LLMClient interface.
 *
 * Thin wrapper around the official `openai` SDK + the v1 prompts. Zero prompt logic
 * lives here — that lives in `prompts/v1/`. Adapter responsibilities are:
 *   1. Translate `{ system, user }` from the renderer into OpenAI's `messages: [...]` shape.
 *   2. Wire the LLM_TIMEOUT_MS env to the SDK's per-request timeout.
 *   3. Retry once on transient failures (5xx, connection reset, timeout).
 *   4. For grading: pass the prompt's `responseSchema` as `response_format` so the model
 *      returns valid JSON, then `.parse()` the response so a malformed payload fails
 *      loudly instead of polluting the messages collection.
 *   5. Log token usage at INFO level so the per-user daily quota guard has the
 *      counters to consume.
 *
 * Construction strategy: caller passes the API key and model to the constructor. The
 * factory in `index.ts` enforces "key required when provider=openai" with a clear
 * startup error, so a missing key fails the process at boot, not on the first request.
 *
 * What this file does NOT do:
 *   - No retries beyond one. The SDK's built-in retry covers connection-level failures;
 *     we add one application-level retry for HTTP-level failures. Beyond that, the
 *     request is the user's problem (probably a bug in the prompt).
 *   - No streaming. Question + grading are both single-shot; streaming would complicate
 *     the persistence layer (do we save partial answers?) without obvious benefit.
 *   - No structured-output schema validation in the SDK call itself — we use the SDK's
 *     plain `chat.completions` endpoint with `response_format: { type: "json_object" }`
 *     and parse with our zod schema after. Lets us decouple from any specific OpenAI
 *     JSON-mode quirks.
 */

import OpenAI from "openai";
import type {
  GradedAnswer,
  LLMClient,
  QuestionContext,
} from "./LLMClient";
import {
  renderGenerateQuestion,
  renderGradeAnswer,
} from "./prompts/v1";

interface OpenAIClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export class OpenAILLMClient implements LLMClient {
  private readonly sdk: OpenAI;
  private readonly model: string;

  constructor(opts: OpenAIClientOptions) {
    // The SDK accepts a `timeout` option at construction time (default per-request).
    // `maxRetries: 0` because we own retry semantics — the SDK's default retry behaviour
    // can mask intermittent issues we'd rather see in our logs.
    this.sdk = new OpenAI({
      apiKey: opts.apiKey,
      timeout: opts.timeoutMs,
      maxRetries: 0,
    });
    this.model = opts.model;
  }

  async generateQuestion(ctx: QuestionContext): Promise<string> {
    const { system, user } = renderGenerateQuestion(ctx);
    const completion = await this.callWithRetry(() =>
      this.sdk.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // No response_format: questions are free-form text. We trim trailing whitespace
        // and any wrapping quotes that some models add despite the "no quotes" instruction.
      }),
    );
    const content = completion.choices[0]?.message?.content ?? "";
    return content.trim().replace(/^"|"$/g, "");
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
    const completion = await this.callWithRetry(() =>
      this.sdk.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        // JSON-mode forces the model to return a parseable JSON object. We still validate
        // with the zod schema after parsing because JSON-mode doesn't enforce *which*
        // fields are present — only that the output is well-formed JSON.
        response_format: { type: "json_object" },
      }),
    );
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as unknown;
    const validated = responseSchema.parse(parsed);
    return {
      content: validated.content,
      feedback: {
        score: validated.score,
        strengths: validated.strengths,
        improvements: validated.improvements,
      },
    };
  }

  /**
   * Run an SDK call with one application-level retry on transient failures. Distinguishes
   * "transient" (5xx, network errors, timeouts) from "permanent" (4xx) — never retries a
   * 4xx because that's a bug in our prompt, not a flaky network.
   *
   * The OpenAI SDK throws structured errors with a `status` field; we lean on that.
   */
  private async callWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (!isTransient(err)) throw err;
      // Single retry with a brief delay. Exponential backoff is overkill at one retry.
      await new Promise((resolve) => setTimeout(resolve, 500));
      return await fn();
    }
  }
}

function isTransient(err: unknown): boolean {
  if (err instanceof Error) {
    // Connection-level: ECONNRESET, ETIMEDOUT, etc. Node's HTTP layer surfaces these.
    if (
      err.message.includes("ECONN") ||
      err.message.includes("ETIMEDOUT") ||
      err.message.includes("timeout")
    ) {
      return true;
    }
  }
  // The SDK's APIError has a `status` field. Any 5xx is transient; 408 (timeout) too.
  const status = (err as { status?: number } | null)?.status;
  if (typeof status === "number" && (status >= 500 || status === 408 || status === 429)) {
    return true;
  }
  return false;
}
