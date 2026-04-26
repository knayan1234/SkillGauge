/**
 * Gemini adapter implementing the project-wide LLMClient interface.
 *
 * Why Gemini: free tier with a 1M-token context window — useful for the long-resume +
 * long-JD + transcript combination this app feeds into every grading call. Generous
 * rate limit (15 RPM / 1500 RPD) covers personal-app load comfortably.
 *
 * Same shape as the OpenAI / Anthropic adapters:
 *   1. Translate `{ system, user }` from the prompt renderer into Gemini's
 *      `{ systemInstruction, contents: [{ role: "user", parts: [{ text }] }] }` shape.
 *   2. Retry once on transient failures (5xx / connection errors).
 *   3. For grading: pass `responseMimeType: "application/json"` + a cleaned-up JSON
 *      schema derived from our zod schema, then `.parse()` the response.
 *   4. Caller (factory) enforces "key required when provider=gemini" — missing key
 *      throws at boot, not on the first interview request.
 *
 * The SDK is `@google/genai` (the post-2024 successor to `@google/generative-ai`).
 * `GoogleGenAI` is the entrypoint; `models.generateContent({...})` is the unified call.
 */

import { GoogleGenAI } from "@google/genai";
import { z, type ZodType } from "zod";
import type {
  GradedAnswer,
  LLMClient,
  QuestionContext,
} from "./LLMClient";
import {
  renderGenerateQuestion,
  renderGradeAnswer,
} from "./prompts/v1";

interface GeminiClientOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export class GeminiLLMClient implements LLMClient {
  private readonly sdk: GoogleGenAI;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(opts: GeminiClientOptions) {
    this.sdk = new GoogleGenAI({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.timeoutMs = opts.timeoutMs;
  }

  async generateQuestion(ctx: QuestionContext): Promise<string> {
    const { system, user } = renderGenerateQuestion(ctx);
    const response = await this.callWithRetry(() =>
      this.withTimeout(
        this.sdk.models.generateContent({
          model: this.model,
          contents: [{ role: "user", parts: [{ text: user }] }],
          config: { systemInstruction: system },
        }),
      ),
    );
    // The SDK's response object exposes a string `text` getter that flattens all parts.
    // Trim trailing whitespace and any wrapping quotes some models emit despite prompts.
    const content = response.text ?? "";
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
    const response = await this.callWithRetry(() =>
      this.withTimeout(
        this.sdk.models.generateContent({
          model: this.model,
          contents: [{ role: "user", parts: [{ text: user }] }],
          config: {
            systemInstruction: system,
            // application/json forces the model to emit a parseable JSON object.
            // We still validate against our zod schema after parsing — Gemini's
            // schema enforcement is best-effort and we'd rather fail loudly here than
            // pollute the messages collection with a malformed feedback doc.
            responseMimeType: "application/json",
            responseSchema: zodToGeminiSchema(responseSchema),
          },
        }),
      ),
    );
    const raw = response.text ?? "{}";
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
   * Wrap a Promise with an AbortController-style timeout. The Gemini SDK doesn't expose
   * a per-request timeout knob today, so we race the request against a setTimeout.
   * On timeout, we throw a synthetic Error that `isTransient` recognises as retryable.
   */
  private withTimeout<T>(promise: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const handle = setTimeout(() => {
        reject(new Error(`Gemini request timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
      promise.then(
        (v) => {
          clearTimeout(handle);
          resolve(v);
        },
        (e: unknown) => {
          clearTimeout(handle);
          reject(e);
        },
      );
    });
  }

  /**
   * Single application-level retry on transient failures (5xx, connection errors,
   * timeouts). 4xx errors are bugs in our prompt and are not retried.
   */
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
  // The Gemini SDK surfaces HTTP errors with a numeric status; any 5xx + 408/429 is
  // transient by our policy.
  const status = (err as { status?: number } | null)?.status;
  if (typeof status === "number" && (status >= 500 || status === 408 || status === 429)) {
    return true;
  }
  return false;
}

/**
 * Translate our zod schema into Gemini's responseSchema shape.
 *
 * Gemini's responseSchema is an OpenAPI-flavoured JSON schema with a small allow-list
 * of types: STRING, NUMBER, INTEGER, BOOLEAN, ARRAY, OBJECT. We only need to support
 * the subset that the grading schema actually uses (object with string/number/array
 * fields), so we hand-build the schema rather than pulling in a full zod-to-openapi
 * converter for one consumer.
 *
 * If the grading schema ever grows past these primitives, extend this function — or
 * swap to `zod-to-json-schema` and post-process. Today's footprint is tiny.
 */
function zodToGeminiSchema(_schema: ZodType<unknown>): Record<string, unknown> {
  // We hard-code the schema shape because Gemini's responseSchema uses uppercase enum
  // values that don't map 1:1 from zod's internal _def shape. Keeping this aligned with
  // `gradeResponseSchema` is a manual concern — if the prompt-side schema evolves, this
  // must be updated in lockstep. The zod schema remains the single source of truth at
  // *parse* time; this function is only for telling Gemini what shape we expect.
  void _schema;
  return {
    type: "OBJECT",
    properties: {
      content: { type: "STRING" },
      score: { type: "INTEGER" },
      strengths: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
      improvements: {
        type: "ARRAY",
        items: { type: "STRING" },
      },
    },
    required: ["content", "score", "strengths", "improvements"],
  };
}

// Re-export so a future test can sanity-check the schema shape compiles.
export const _testing = { zodToGeminiSchema, z };
