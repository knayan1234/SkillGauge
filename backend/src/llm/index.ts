/**
 * LLMClient factory. Selects an implementation based on `LLM_PROVIDER` and validates
 * that the corresponding API key is present. Boot fails loudly with a clear message if
 * a real provider is selected without its key — better than 500-ing on the first
 * interview request.
 *
 * `LLM_PROVIDER=stub` requires no keys; the deterministic stub always works. Real
 * providers are placeholder-mode-friendly: the adapter classes are committed and
 * compile-checked, but they're only instantiated when a key is configured AND the
 * provider is selected, so dev workflows without keys keep working unchanged.
 */

import { env } from "@/config/env";
import { AnthropicLLMClient } from "./anthropicClient";
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
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER as string}`);
  }
}
