/**
 * LLMClient factory. Selects an implementation based on `LLM_PROVIDER` and validates
 * that the corresponding API key is present.
 *
 * ============================================================================
 * CURRENT STATE — what's running and what's needed to switch on real LLMs
 * ============================================================================
 *
 *   DEFAULT (`LLM_PROVIDER=stub`): the deterministic `stubClient` returns canned
 *   questions from a curated bank organised by interview style + difficulty + role
 *   level, and grades answers by length-proxy heuristic (longer answer = higher
 *   score, capped at 8/10, with style modifiers). Zero API keys needed; works
 *   offline; FE flows look identical to real-LLM mode. Useful for development +
 *   the user trying the app before signing up for an LLM provider.
 *
 *   TO ENABLE REAL LLM-DRIVEN QUESTIONS + RUBRIC GRADING:
 *
 *   1. **Pick a provider** — Gemini is recommended (free tier, 1M-token context):
 *        - Gemini:    https://aistudio.google.com/apikey  (free, no card)
 *        - OpenAI:    https://platform.openai.com/api-keys  (paid)
 *        - Anthropic: https://console.anthropic.com/settings/keys  (paid)
 *
 *   2. **Drop the key in `backend/.env`** under the matching variable:
 *        GEMINI_API_KEY=...    (for Gemini)
 *        OPENAI_API_KEY=sk-... (for OpenAI)
 *        ANTHROPIC_API_KEY=... (for Anthropic)
 *
 *   3. **Flip the provider switch** in `backend/.env`:
 *        LLM_PROVIDER=gemini   (or openai / anthropic)
 *
 *   4. **Optionally** also set `EMBEDDINGS_PROVIDER=gemini` so the long-term-memory
 *      vector layer uses real embeddings (currently the stub embeddings produce
 *      deterministic-but-meaningless vectors; the storage path runs end-to-end
 *      regardless so you can flip embeddings on later without code changes).
 *
 *   5. **Restart the BE** dev server so the env reload picks up the new provider.
 *
 *   No FE work, no schema migration, no other code change. The factory below
 *   instantiates the chosen adapter; every call site in `sessions.service` then
 *   calls `client.generateQuestion()` and `client.gradeAnswer()` against the same
 *   `LLMClient` interface. The stub and the real providers are wire-compatible.
 * ============================================================================
 */

import { env } from "@/config/env";
import { AnthropicLLMClient } from "./anthropicClient";
import { GeminiLLMClient } from "./geminiClient";
import type { LLMClient } from "./LLMClient";
import { OpenAILLMClient } from "./openaiClient";
import { stubClient } from "./stubClient";

export function createLLMClient(): LLMClient {
  switch (env.LLM_PROVIDER) {
    case "stub":
      return stubClient;
    case "openai":
      if (!env.OPENAI_API_KEY) {
        throw new Error(
          "LLM_PROVIDER=openai but OPENAI_API_KEY is not set. Add the key to backend/.env or switch LLM_PROVIDER back to 'stub'.",
        );
      }
      return new OpenAILLMClient({
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        timeoutMs: env.LLM_TIMEOUT_MS,
      });
    case "anthropic":
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error(
          "LLM_PROVIDER=anthropic but ANTHROPIC_API_KEY is not set. Add the key to backend/.env or switch LLM_PROVIDER back to 'stub'.",
        );
      }
      return new AnthropicLLMClient({
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL,
        timeoutMs: env.LLM_TIMEOUT_MS,
      });
    case "gemini":
      if (!env.GEMINI_API_KEY) {
        throw new Error(
          "LLM_PROVIDER=gemini but GEMINI_API_KEY is not set. Get a free key from https://aistudio.google.com/apikey and add it to backend/.env, or switch LLM_PROVIDER back to 'stub'.",
        );
      }
      return new GeminiLLMClient({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_MODEL,
        timeoutMs: env.LLM_TIMEOUT_MS,
      });
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER as string}`);
  }
}
