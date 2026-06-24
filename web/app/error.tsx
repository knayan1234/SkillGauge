"use client";

import { useEffect } from "react";

// Next.js error boundary contract: `error` is the thrown error, `reset` retries the segment.
interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">Error</h1>
        <p className="text-muted-foreground mb-6">
          {isDev && error?.message
            ? error.message
            : "An unexpected error occurred."}
        </p>
        {isDev && error?.stack && (
          <pre className="w-full p-4 overflow-x-auto bg-card border border-border rounded-lg text-left text-xs">
            <code>{error.stack}</code>
          </pre>
        )}
        <button
          onClick={reset}
          className="inline-block mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
