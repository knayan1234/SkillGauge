import { buildApp } from "./app";
import { env } from "./config/env";

async function main(): Promise<void> {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: env.HOST });
}

main().catch((err: unknown) => {
  // Fatal bootstrap errors — nothing listening yet, so log and exit non-zero.
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
