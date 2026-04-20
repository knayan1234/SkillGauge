import { MongoMemoryServer } from "mongodb-memory-server";
import { closeDb, getDb } from "../src/db/connection";

// Per-suite mongod. Started once per describe in beforeAll, torn down in afterAll.
// We write to process.env before any buildApp() call so connection.ts picks up the right URI.
// Each test drops the DB so no state leaks between cases.
let mongod: MongoMemoryServer | null = null;

export async function startMongo(): Promise<void> {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.MONGODB_DB = `skillgauge_test_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function stopMongo(): Promise<void> {
  await closeDb();
  if (mongod) {
    await mongod.stop();
    mongod = null;
  }
}

// Drop all data between tests. Cheaper than restarting mongod; indexes are re-created by
// buildApp() → ensureIndexes() on the next test.
export async function resetDb(): Promise<void> {
  const db = await getDb();
  await db.dropDatabase();
  await closeDb();
}
