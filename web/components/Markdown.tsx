/**
 * Markdown — renders LLM-authored prose with code-block + GFM support.
 *
 * Why we need it:
 *   - Question + feedback content frequently includes code, lists, and inline `code`,
 *     especially for technical interviews. Rendering it as a raw `<p>{content}</p>` swallows
 *     the formatting and makes feedback unreadable for any code-adjacent role.
 *   - Sample code, file paths, function names — all need monospace + a tinted background.
 *
 * Why react-markdown (and not a custom parser):
 *   - Battle-tested, ~14KB gzipped, and configurable via plugins (we use remark-gfm for
 *     tables / strikethrough / task lists).
 *   - Sanitization is built in — react-markdown will not render raw HTML by default,
 *     which is the right posture for content sourced from an LLM (or, eventually, from
 *     other users via shared sessions).
 *
 * Tailwind sizing notes:
 *   - The component intentionally does NOT apply prose styles globally — the parent
 *     bubble already controls font-size, leading, and color. We only style the parts
 *     that prose normally does (lists, code, strong/em, links).
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        "text-sm text-foreground leading-relaxed",
        // Prose-light styles — kept as a co-located class string rather than the heavier
        // @tailwindcss/typography plugin so we avoid pulling in a peer dep for one consumer.
        "[&>p]:mb-2 last:[&>p]:mb-0",
        "[&_strong]:font-semibold [&_em]:italic",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-2",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-2",
        "[&_a]:underline [&_a]:underline-offset-2 [&_a]:text-primary",
        "[&_code]:rounded [&_code]:bg-muted/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:font-mono",
        "[&_pre]:rounded-md [&_pre]:bg-muted/70 [&_pre]:p-3 [&_pre]:my-2 [&_pre]:overflow-x-auto",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-xs",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // Disabling raw-HTML rendering is the default; called out here so future
        // contributors don't enable rehype-raw without considering XSS implications.
        components={{
          // Open external links in a new tab. LLM responses occasionally cite URLs;
          // we'd rather not yank the user out of their interview flow.
          a: ({ ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
