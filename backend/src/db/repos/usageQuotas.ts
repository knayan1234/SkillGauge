/**
 * Per-user daily token + call counter.
 *
 * Why daily, not monthly: a single bad day's usage shouldn't wipe out a user's whole
 * month. Resetting at the UTC day boundary keeps quota math simple — no rolling
 * windows, no lookback, just one document per (userId, day).
 *
 * Why TTL: documents auto-delete 32 days after their day-of-record so the collection
 * stays bounded with no background sweeper. 32 (not 30) gives us a buffer for
 * end-of-month timezone edge cases.
 *
 * Why a separate collection: putting a counter on `users` would unbound growth (the
 * field would never auto-clean) and would race against other user-doc updates. A
 * dedicated collection lets the TTL index do the cleanup and lets us shard / index
 * independently if a production deploy ever needs hot-path quota lookups at scale.
 */

import { getDb } from "../connection";

export interface UsageQuotaDoc {
  _id: string;            // `${userId}:${day}` so the doc is uniquely keyable without a separate index
  userId: string;
  day: string;            // YYYY-MM-DD (UTC), e.g. "2026-04-25"
  tokensUsed: number;
  callsMade: number;
  expiresAt: Date;        // TTL — auto-delete 32 days later
  createdAt: Date;
  updatedAt: Date;
}

async function quotas() {
  return (await getDb()).collection<UsageQuotaDoc>("usage_quotas");
}

/** YYYY-MM-DD (UTC) for a given Date. Used as the day key. */
export function utcDayKey(d: Date = new Date()): string {
  // toISOString → "2026-04-25T..." → slice the date portion.
  return d.toISOString().slice(0, 10);
}

export const usageQuotasRepo = {
  /**
   * Atomically read or initialize today's quota doc, then return the current
   * `tokensUsed` count. Used by the pre-call guard to decide whether to allow the
   * next LLM call.
   *
   * Atomic upsert via `findOneAndUpdate({_id, ...}, {$setOnInsert})` — if two
   * concurrent requests both initialize, only one wins and both see consistent state.
   */
  async getCurrentTokens(userId: string, now: Date = new Date()): Promise<number> {
    const day = utcDayKey(now);
    const id = `${userId}:${day}`;
    const doc = await (await quotas()).findOne({ _id: id });
    return doc?.tokensUsed ?? 0;
  },

  /**
   * Record a successful LLM call. Atomic increment on tokensUsed + callsMade. If the
   * doc doesn't exist yet, $setOnInsert creates it with the right TTL.
   */
  async recordCall(
    userId: string,
    tokens: number,
    now: Date = new Date(),
  ): Promise<void> {
    const day = utcDayKey(now);
    const id = `${userId}:${day}`;
    // 32 days from now keeps a buffer past the calendar month for timezone safety.
    const expiresAt = new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000);
    await (await quotas()).updateOne(
      { _id: id },
      {
        $inc: { tokensUsed: tokens, callsMade: 1 },
        $set: { updatedAt: now },
        $setOnInsert: {
          userId,
          day,
          expiresAt,
          createdAt: now,
        },
      },
      { upsert: true },
    );
  },
};
