/**
 * Gemini embeddings adapter.
 *
 * Reuses the same `GEMINI_API_KEY` as the chat adapter — one key, two model surfaces.
 * Default model is `gemini-embedding-001`, returning 768-dim float vectors. Override
 * via `GEMINI_EMBED_MODEL` if a future model offers better quality.
 *
 * Why we don't subclass the chat adapter: chat and embeddings are independent endpoints
 * with different rate limits, retry semantics, and timeouts. Keeping them in separate
 * adapter classes mirrors the LLMClient + EmbeddingsClient interface split — same
 * pattern, different concerns.
 */

import { GoogleGenAI } from "@google/genai";
import type { EmbeddingsClient } from "./EmbeddingsClient";

interface GeminiEmbeddingsOptions {
  apiKey: string;
  model: string;
  dimensions: number;
}

export class GeminiEmbeddingsClient implements EmbeddingsClient {
  private readonly sdk: GoogleGenAI;
  private readonly model: string;
  readonly dimensions: number;

  constructor(opts: GeminiEmbeddingsOptions) {
    this.sdk = new GoogleGenAI({ apiKey: opts.apiKey });
    this.model = opts.model;
    this.dimensions = opts.dimensions;
  }

  async embed(text: string): Promise<number[]> {
    // The SDK's `embedContent` returns `{ embeddings: [{ values: number[] }] }` — one
    // entry per input. We pass a single string so we read [0].values.
    const result = await this.sdk.models.embedContent({
      model: this.model,
      contents: text,
    });
    const values = result.embeddings?.[0]?.values;
    if (!values || values.length === 0) {
      throw new Error("Gemini embedding response was empty");
    }
    return values;
  }
}
