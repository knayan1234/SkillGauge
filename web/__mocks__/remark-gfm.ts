// Jest stub for remark-gfm — same ESM-vs-CJS pain as react-markdown.
// The real plugin only matters at render time; under the react-markdown stub we
// never call it, so the no-op default suffices.

const remarkGfm = () => undefined;
export default remarkGfm;
