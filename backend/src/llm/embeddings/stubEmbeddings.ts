/**
 * Deterministic stub embeddings.
 *
 * Why a stub: lets every code path that depends on `EmbeddingsClient` work in dev and
 * tests without an API key. The vectors are nonsense (hash-derived, not semantically
 * meaningful), so vector search results against stub embeddings are useless — but the
 * interface compiles, the storage path runs, and the long-term memory writes don't
 * crash without a key.
 *
 * Implementation: SHA-256 the input, then expand the 32 bytes into a 768-float vector
 * by repeating-and-tweaking. Same input always produces the same vector (deterministic).
 * Vectors are L2-normalized so dot-product similarity stays in [-1, 1] like a real
 * provider would emit.
 */

import { createHash } from "node:crypto";
import type { EmbeddingsClient } from "./EmbeddingsClient";

// 768 matches Gemini's default dim — keeps the Atlas Search index spec identical
// whether you swap providers locally during dev. If you need a different stub dim,
// update this constant + the index spec in `requirements.md` together.
const STUB_DIM = 768;

function l2Normalize(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, x) => sum + x * x, 0));
  if (norm === 0) return vec;
  return vec.map((x) => x / norm);
}

class StubEmbeddingsClient implements EmbeddingsClient {
  readonly dimensions = STUB_DIM;

  async embed(text: string): Promise<number[]> {
    // SHA-256 → 32 bytes. Expand to 768 floats by reading the digest in repeated
    // overlapping windows. Deterministic, fast, semantically meaningless.
    const digest = createHash("sha256").update(text).digest();
    const out = new Array<number>(STUB_DIM);
    for (let i = 0; i < STUB_DIM; i++) {
      // Read a byte at a rotating index. Map [0, 255] → [-1, 1] so the vector lives
      // in the typical embedding range.
      const byte = digest[i % digest.length];
      out[i] = (byte / 127.5) - 1;
    }
    return l2Normalize(out);
  }
}

export const stubEmbeddings: EmbeddingsClient = new StubEmbeddingsClient();
