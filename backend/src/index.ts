import { buildApp } from "./app";
import { env } from "./config/env";

async function main(): Promise<void> {
  const app = await buildApp();
  app.listen(env.PORT, env.HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://${env.HOST}:${env.PORT}`);
  });
}

main().catch((err: unknown) => {
  // Fatal bootstrap errors — nothing listening yet, so log and exit non-zero.
  // eslint-disable-next-line no-console
  console.error("Failed to start server:", err);
  process.exit(1);
});
