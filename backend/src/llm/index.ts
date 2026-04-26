import { env } from "@/config/env";
import type { LLMClient } from "./LLMClient";
import { stubClient } from "./stubClient";

// Factory selects the implementation from env. The stub is wired today; openai/anthropic
// cases throw intentionally so forgetting to ship the real adapter fails loudly instead
// of silently falling back to the stub.
export function createLLMClient(): LLMClient {
  switch (env.LLM_PROVIDER) {
    case "stub":
      return stubClient;
    case "openai":
    case "anthropic":
      throw new Error(
        `LLM_PROVIDER=${env.LLM_PROVIDER} adapter not yet implemented`,
      );
    default:
      throw new Error(`Unknown LLM_PROVIDER: ${env.LLM_PROVIDER as string}`);
  }
}
