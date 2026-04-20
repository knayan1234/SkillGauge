import { env } from "@/config/env";
import type { LLMClient } from "./LLMClient";
import { stubClient } from "./stubClient";

// Factory selects the implementation from env. Phase 1 only wires `stub`; openai/anthropic cases
// throw intentionally so forgetting to ship the Phase 2 adapter fails loudly instead of silently
// falling back.
export function createLLMClient(): LLMClient {
  switch (env.LLM_PROVIDER) {
    case "stub":
      return stubClient;
    case "openai":
    case "anthropic":
      throw new Error(
        `LLM_PROVIDER=${env.LLM_PROVIDER} not implemented until Phase 2`,
      );
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER as string}`);
  }
}
