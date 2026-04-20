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
