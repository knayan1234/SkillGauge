import { getDb, closeDb } from "./connection";

// Idempotent. Mongo's createIndex is a no-op when the exact same index already exists,
// so this is safe to run on every boot and via `npm run migrate`.
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  // users: email is the login handle — must be unique.
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  // sessions: listing / ownership checks are always userId-scoped.
  await db.collection("sessions").createIndex({ userId: 1 });

  // messages: transcript reads are always by sessionId.
  await db.collection("messages").createIndex({ sessionId: 1 });

  // messages: idempotency for question fetch — there can be at most one question per
  // (sessionId, questionIndex). Partial index so only documents with a questionIndex
  // participate — answers and feedback messages don't have one.
  await db
    .collection("messages")
    .createIndex(
      { sessionId: 1, questionIndex: 1 },
      {
        unique: true,
        partialFilterExpression: {
          type: "question",
          questionIndex: { $exists: true },
        },
      },
    );

  // password_reset_tokens:
  // - tokenHash unique so a collision can't grant access to another user's reset.
  // - expiresAt TTL → Mongo deletes the doc automatically once the moment passes,
  //   so used + expired tokens disappear without a cron job. expireAfterSeconds=0
  //   means "delete the moment expiresAt is in the past."
  await db
    .collection("password_reset_tokens")
    .createIndex({ tokenHash: 1 }, { unique: true });
  await db
    .collection("password_reset_tokens")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // login_attempts:
  // - (emailHash, expiresAt) compound supports countActive() — count all unexpired
  //   failures for a given email in one indexed query, hot path on every login.
  // - expiresAt TTL auto-deletes failures after the lockout window passes, keeping the
  //   collection bounded with no background job.
  await db
    .collection("login_attempts")
    .createIndex({ emailHash: 1, expiresAt: 1 });
  await db
    .collection("login_attempts")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // usage_quotas:
  // - userId index supports per-user history queries (e.g., "show me all of Jane's
  //   day-by-day usage for the last week"). The dashboard aggregations may use this.
  // - expiresAt TTL auto-deletes quota docs 32 days after their day-of-record so the
  //   collection stays bounded with no background sweeper.
  await db.collection("usage_quotas").createIndex({ userId: 1 });
  await db
    .collection("usage_quotas")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  // memories (long-term memory + Atlas Vector Search):
  // - (userId, createdAt) supports the dashboard / sidebar listing path.
  // - sessionId index supports "show all memories for this session" queries.
  //
  // The vector-search index on `embedding` is NOT created here — Atlas Search indexes
  // live outside the standard driver's createIndex API. Create it via Atlas UI / Admin
  // API with the JSON spec documented in db/repos/memories.ts. Local mongods (without
  // Atlas Search) won't have the vector index, and `searchSimilar()` calls will fail
  // gracefully — the storage path still works.
  await db.collection("memories").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("memories").createIndex({ sessionId: 1 });
}

// Allow `tsx src/db/indexes.ts` (or `node dist/db/indexes.js`) as a one-shot.
if (require.main === module) {
  ensureIndexes()
    .then(async () => {
      // eslint-disable-next-line no-console
      console.log("Indexes ensured.");
      await closeDb();
    })
    .catch(async (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("Failed to ensure indexes:", err);
      await closeDb();
      process.exit(1);
    });
}
