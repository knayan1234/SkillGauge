/**
 * Public, unauthenticated health endpoints.
 *
 * Two routes:
 *   - GET /api/health      — liveness probe. Single concern: "is the process up?"
 *                            Returns immediately, doesn't touch the DB. A sibling
 *                            /api/health/ready that pings Mongo for readiness can be
 *                            added later for behind-load-balancer deploys.
 *   - GET /api/health/info — exposes the active LLM provider + model so the FE badge
 *                            can show users what's actually grading their answers.
 *                            Public on purpose: no auth, no PII; the values are already
 *                            deterministic from server config. Caching client-side via
 *                            react-query staleTime: Infinity keeps the request load
 *                            near-zero.
 */

import type { FastifyInstance } from "fastify";
import { env } from "@/config/env";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness only. Deeper checks (DB ping, LLM reachable) belong on a /ready sibling.
  app.get("/api/health", async () => ({ status: "ok" }));

  // Exposes the active LLM provider so the FE can show a "🤖 stub" / "🤖 openai" /
  // "🤖 anthropic" badge in the interview header.
  //
  // `llmModel` is null when LLM_PROVIDER=stub (the stub has no concept of a model);
  // populated from the matching per-provider env (`OPENAI_MODEL` / `ANTHROPIC_MODEL`)
  // when a real provider is active, so the badge auto-renders e.g.
  // "🤖 openai · gpt-4o-mini" the moment ops drops in a key.
  app.get("/api/health/info", async () => {
    let llmModel: string | null = null;
    if (env.LLM_PROVIDER === "openai") llmModel = env.OPENAI_MODEL;
    else if (env.LLM_PROVIDER === "anthropic") llmModel = env.ANTHROPIC_MODEL;
    return {
      llmProvider: env.LLM_PROVIDER,
      llmModel,
    };
  });
}
