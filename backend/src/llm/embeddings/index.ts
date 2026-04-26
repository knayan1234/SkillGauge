/**
 * Embeddings client factory. Mirrors the LLMClient factory pattern.
 *
 * ============================================================================
 * CURRENT STATE — vector layer + what's needed to make it search-capable
 * ============================================================================
 *
 *   DEFAULT (`EMBEDDINGS_PROVIDER=stub`): every Q/A/feedback row gets indexed
 *   into the `memories` collection with a deterministic SHA-256-derived 768-dim
 *   vector. The STORAGE path runs end-to-end (so flipping to a real provider
 *   later requires zero code change), but the vectors are semantically meaningless
 *   — `$vectorSearch` queries return effectively random results. Don't rely on
 *   memory recall in stub mode; the non-repetition guarantee is enforced by a
 *   different mechanism (`messagesRepo.findQuestionsByResume`) that doesn't need
 *   vectors.
 *
 *   TO ENABLE REAL CROSS-SESSION SEMANTIC RECALL:
 *
 *   1. **Get a Gemini API key** (same one as for the LLM if you've already set
 *      that up): https://aistudio.google.com/apikey
 *
 *   2. **Set in `backend/.env`**:
 *        GEMINI_API_KEY=...
 *        EMBEDDINGS_PROVIDER=gemini
 *
 *   3. **Create the Atlas Vector Search index** — Atlas Search indexes can't be
 *      created via the standard MongoDB driver, so this is a manual step:
 *
 *        a. Open Atlas → your cluster → "Search" tab → "Create Search Index"
 *        b. Choose "JSON Editor", database `skillgauge_dev` (or your DB name),
 *           collection `memories`, index name **`memory_vec_index`**
 *        c. Paste this JSON:
 *
 *           {
 *             "fields": [
 *               {
 *                 "type": "vector",
 *                 "path": "embedding",
 *                 "numDimensions": 768,
 *                 "similarity": "cosine"
 *               },
 *               {
 *                 "type": "filter",
 *                 "path": "userId"
 *               }
 *             ]
 *           }
 *
 *        d. Wait ~1 minute for the index to flip to "Active".
 *
 *   4. **Restart the BE** so the env reload picks up the new provider.
 *
 *   What changes once it's live: when generating a question, the system can
 *   search the user's past memories for content semantically similar to the
 *   current context (résumé, JD, recent answers) and feed the top matches into
 *   the prompt. The LLM then references those past struggles by topic, not by
 *   keyword — true cross-session continuity. Without the index this code path
 *   throws on `$vectorSearch`, which we catch and degrade gracefully (no
 *   augmented context). The interview itself keeps working either way.
 * ============================================================================
 */

import { env } from "@/config/env";
import type { EmbeddingsClient } from "./EmbeddingsClient";
import { GeminiEmbeddingsClient } from "./geminiEmbeddings";
import { stubEmbeddings } from "./stubEmbeddings";

let cached: EmbeddingsClient | null = null;

/**
 * Module-level cache so multiple call sites share one instance — important for the
 * Gemini adapter because `GoogleGenAI` allocates an HTTP client on construction. The
 * cache is invalidated only on process restart, which is fine because env can't change
 * mid-process.
 */
export function getEmbeddingsClient(): EmbeddingsClient {
  if (cached) return cached;

  switch (env.EMBEDDINGS_PROVIDER) {
    case "stub":
      cached = stubEmbeddings;
      return cached;
    case "gemini":
      if (!env.GEMINI_API_KEY) {
        throw new Error(
          "EMBEDDINGS_PROVIDER=gemini but GEMINI_API_KEY is not set. Get a free key from https://aistudio.google.com/apikey or switch EMBEDDINGS_PROVIDER back to 'stub'.",
        );
      }
      cached = new GeminiEmbeddingsClient({
        apiKey: env.GEMINI_API_KEY,
        model: env.GEMINI_EMBED_MODEL,
        dimensions: env.EMBEDDINGS_DIMENSIONS,
      });
      return cached;
    default:
      throw new Error(
        `Unknown EMBEDDINGS_PROVIDER: ${env.EMBEDDINGS_PROVIDER as string}`,
      );
  }
}

// Test hook — lets a unit test reset the cache between cases.
export function _resetEmbeddingsCache(): void {
  cached = null;
}
