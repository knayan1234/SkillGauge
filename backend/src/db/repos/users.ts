import { getDb } from "../connection";

// UserDoc is the Mongo storage shape — camelCase, no _id alias. We keep string IDs (UUIDs)
// set by the service layer so the FE-facing API contract stays stable even if we later add
// ObjectId conversions.
export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

async function users() {
  return (await getDb()).collection<UserDoc>("users");
}

export const usersRepo = {
  async create(doc: UserDoc): Promise<void> {
    await (await users()).insertOne(doc);
  },

  async findByEmail(email: string): Promise<UserDoc | null> {
    // Emails are already lowercased by the zod schema upstream; compare as-is.
    return (await users()).findOne({ email });
  },

  async findById(id: string): Promise<UserDoc | null> {
    return (await users()).findOne({ _id: id });
  },

  // Used by the password reset confirm flow (Phase 1.5b). Single-purpose updater so the
  // service stays at one DB call per concern.
  // TODO:phase-1.5d add a sibling bumpJwtEpoch() and call it from the same code path.
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await (await users()).updateOne({ _id: id }, { $set: { passwordHash } });
  },
};
