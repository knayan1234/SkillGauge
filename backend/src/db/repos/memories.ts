/**
 * Long-term memory store. Each row is one indexed snippet of interview content
 * (question, answer, or feedback) with its embedding vector for retrieval.
 *
 * Why a separate collection vs. denormalising into `messages`:
 *   1. Search-index lifecycle — the Atlas Vector Search index lives on this collection
 *      only, so backups, exports, and rebuilds don't have to touch the messages
 *      collection. If we drop the index to swap embedding providers, we never risk
 *      partial state on the chat transcript.
 *   2. Storage cost — vectors are large (768 floats × 8 bytes ~= 6 KB each). Keeping
 *      them out of the hot `messages` reads lets the chat list stay cheap.
 *   3. Optionality — if a user has `EMBEDDINGS_PROVIDER=stub`, we still write rows
 *      with stub vectors so the storage path is exercised, but the search results
 *      are nonsense. Toggling to gemini later means re-indexing existing rows.
 *
 * Atlas Vector Search index — must be created manually (or via Atlas Admin API):
 *   {
 *     "name": "memory_vec_index",
 *     "definition": {
 *       "fields": [{
 *         "type": "vector",
 *         "path": "embedding",
 *         "numDimensions": 768,
 *         "similarity": "cosine"
 *       }, {
 *         "type": "filter",
 *         "path": "userId"
 *       }]
 *     }
 *   }
 *
 * The `userId` filter is critical — it scopes search to the requesting user so we
 * never leak one user's memories into another's results.
 */

import { getDb } from "../connection";

export type MemoryKind = "question" | "answer" | "feedback" | "resume" | "jd";

export interface MemoryDoc {
  _id: string;
  userId: string;
  sessionId: string;
  // Optional — `kind: "resume"` / `"jd"` rows aren't tied to a specific message,
  // they're indexed once at session init.
  messageId?: string;
  kind: MemoryKind;
  // The text that was embedded. Stored verbatim for two reasons: (a) so retrieval can
  // hand the snippet back without a second lookup, (b) so we can re-embed if we ever
  // change embedding providers without losing the source content.
  content: string;
  embedding: number[];
  // Optional score — for `kind: "feedback"` rows we copy the rubric score so the
  // dashboard layer can compute weak-area aggregates without joining back to messages.
  score?: number;
  createdAt: Date;
}

async function memories() {
  return (await getDb()).collection<MemoryDoc>("memories");
}

/**
 * Result shape from the vector search aggregation. `score` here is the cosine
 * similarity from Atlas (0..1), distinct from the rubric `score` field on the doc.
 */
export interface MemorySearchResult {
  _id: string;
  userId: string;
  sessionId: string;
  kind: MemoryKind;
  content: string;
  rubricScore?: number;
  similarity: number;
}

export const memoriesRepo = {
  async insert(doc: MemoryDoc): Promise<void> {
    await (await memories()).insertOne(doc);
  },

  /**
   * Cascade-delete every memory row tied to a given session. Called when a user
   * deletes a chatroom; ownership check happens upstream in the service.
   */
  async deleteBySession(sessionId: string): Promise<void> {
    await (await memories()).deleteMany({ sessionId });
  },

  /**
   * Insert many in one round-trip. Useful for batched session-init writes (resume
   * + JD + first question all indexed together).
   */
  async insertMany(docs: MemoryDoc[]): Promise<void> {
    if (docs.length === 0) return;
    await (await memories()).insertMany(docs);
  },

  /**
   * List a user's memories sorted by createdAt desc. Cheap enough for an early
   * dashboard surface; once volume grows past a few thousand rows per user, swap
   * to a paged variant.
   */
  async listByUser(userId: string, limit = 200): Promise<MemoryDoc[]> {
    return (await memories())
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  },

  /**
   * Vector-search for memories similar to the query embedding, scoped to a single
   * user. Returns the top `k` matches with cosine similarity. Index name must match
   * the Atlas Search index created out-of-band — see the docstring at the top of
   * this file for the JSON spec.
   *
   * Defensive on non-Atlas environments: the $vectorSearch aggregation only works
   * against an Atlas cluster with the index defined. Local mongods without Atlas
   * Search will throw — callers should treat this method as best-effort and degrade
   * gracefully (return no augmented context) on error.
   */
  async searchSimilar(params: {
    userId: string;
    queryEmbedding: number[];
    k?: number;
    excludeSessionId?: string;
  }): Promise<MemorySearchResult[]> {
    const { userId, queryEmbedding, k = 5, excludeSessionId } = params;
    const filter: Record<string, unknown> = { userId };
    if (excludeSessionId) filter.sessionId = { $ne: excludeSessionId };

    const cursor = (await memories()).aggregate<{
      _id: string;
      userId: string;
      sessionId: string;
      kind: MemoryKind;
      content: string;
      score?: number;
      similarity: number;
    }>([
      {
        $vectorSearch: {
          index: "memory_vec_index",
          path: "embedding",
          queryVector: queryEmbedding,
          // numCandidates is Atlas's HNSW exploration budget — 10x k is a reasonable
          // default per Atlas docs; tune if recall is poor at scale.
          numCandidates: Math.max(50, k * 10),
          limit: k,
          filter,
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          sessionId: 1,
          kind: 1,
          content: 1,
          score: 1,
          similarity: { $meta: "vectorSearchScore" },
        },
      },
    ]);
    const rows = await cursor.toArray();
    return rows.map((r) => ({
      _id: r._id,
      userId: r.userId,
      sessionId: r.sessionId,
      kind: r.kind,
      content: r.content,
      rubricScore: r.score,
      similarity: r.similarity,
    }));
  },
};
