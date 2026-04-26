// Jest stub for react-markdown.
//
// react-markdown ships as pure ESM and Jest's default CJS transform chokes on it
// (and its deep dependency chain: unified, remark-*, mdast-*, micromark-*…). Pulling
// the whole graph through a babel transform inflates test runtime considerably for
// little value — the tests we care about don't assert markdown output, only that the
// content text renders.
//
// This stub renders the raw `children` string as a plain <div>, which is enough for
// `screen.getByText("…")` matchers to keep working. Re-export shape mirrors the real
// package's default export so import sites don't need changes under test.

import type { ReactNode } from "react";

interface Props {
  children: string;
  components?: Record<string, unknown>;
  remarkPlugins?: unknown[];
}

function ReactMarkdown({ children }: Props): ReactNode {
  return <div>{children}</div>;
}

export default ReactMarkdown;
