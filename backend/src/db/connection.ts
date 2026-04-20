import { MongoClient, type Db } from "mongodb";
import { env } from "@/config/env";

// Single process-wide Mongo client. The driver pools connections internally, so we don't
// want more than one client per process. We read MONGODB_URI / MONGODB_DB from process.env
// at connect time (not at module import) so tests can swap an in-memory server's URI right
// before calling buildApp().
let client: MongoClient | null = null;
let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (!db) {
    const uri = process.env.MONGODB_URI ?? env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB ?? env.MONGODB_DB;
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
  }
  return db;
}

// Called by tests between runs + on server shutdown. Safe to call when not connected.
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
