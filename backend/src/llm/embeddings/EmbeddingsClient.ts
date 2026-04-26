/**
 * Provider-agnostic embeddings interface.
 *
 * Mirrors the LLMClient pattern: services depend on this interface, never a vendor SDK.
 * Today's two implementations are `stubEmbeddings` (deterministic hash-based fallback,
 * always works in dev/tests with no key) and `geminiEmbeddings` (real Gemini embedding
 * model — same key as the chat adapter).
 *
 * Why this exists separately from `LLMClient`: chat completions and vector embeddings
 * are different model surfaces with different cost characteristics. Forcing them through
 * one interface would make the stub awkward (the stub doesn't have a meaningful "embed
 * this text" implementation) and would couple unrelated upgrade decisions.
 */

export interface EmbeddingsClient {
  /**
   * Returns the float-vector embedding for `text`. Vector dimensionality is provider-
   * specific (Gemini's `gemini-embedding-001` returns 768 by default; OpenAI's
   * `text-embedding-3-small` returns 1536). Storage layer trusts whatever dim the
   * configured provider returns — the Atlas Search index must be created with the
   * matching `numDimensions` value.
   */
  embed(text: string): Promise<number[]>;

  /**
   * Vector dimensionality this client emits. Read at boot and used to validate /
   * provision the Atlas Search index. Stable across calls for a given configuration.
   */
  readonly dimensions: number;
}
