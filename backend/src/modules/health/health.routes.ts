import type { FastifyInstance } from "fastify";

// Public, unauthenticated. Phase 4 will add deeper checks (DB ping, LLM reachable).
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => ({ status: "ok" }));
}
