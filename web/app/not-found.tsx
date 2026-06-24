"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  const pathname = usePathname();

  useEffect(() => {
    // 404s are surface-area for typo'd links + stale bookmarks. Logging at error level
    // makes them stand out in CI / Sentry once observability lands; until then it's a
    // grep target in the dev console.
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname,
    );
  }, [pathname]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="p-2">
          <EmptyState
            icon={Compass}
            title="Page not found"
            description={`We couldn't find anything at "${pathname}". The link might be old, the page might have moved, or you might have typed it from memory.`}
            action={
              <Button asChild>
                <Link href="/">Return to home</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
