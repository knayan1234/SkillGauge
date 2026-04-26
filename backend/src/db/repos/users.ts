import { getDb } from "../connection";

// UserDoc is the Mongo storage shape — camelCase, no _id alias. We keep string IDs (UUIDs)
// set by the service layer so the FE-facing API contract stays stable even if we later add
// ObjectId conversions.
//
// `jwtEpoch` participates in JWT verification — every token signed for this user carries
// the user's epoch at sign-time, and `requireAuth` rejects tokens whose epoch is older
// than the user's current epoch. Bumping the epoch is the "log-out-everywhere" mechanism.
// Legacy docs may not have this field; the service layer treats `undefined` as `1` (the
// initial value) on read for back-compat.
export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
  jwtEpoch?: number;
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

  // Used by the password reset confirm flow. Single-purpose updater so the
  // service stays at one DB call per concern.
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await (await users()).updateOne({ _id: id }, { $set: { passwordHash } });
  },

  // Session rotation: atomic $inc on jwtEpoch. If the field is missing (legacy user doc),
  // Mongo treats $inc on undefined as starting from 0, so the result is 1 — but since
  // fresh signs use `epoch ?? 1`, the post-bump epoch will be 2 after the first ever bump
  // on a legacy doc. That's intentional: any bump invalidates everything signed before
  // the bump.
  async bumpJwtEpoch(id: string): Promise<void> {
    await (await users()).updateOne({ _id: id }, { $inc: { jwtEpoch: 1 } });
  },
};
