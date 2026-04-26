/**
 * ChatSkeleton — placeholder rows shown while the interview is hydrating.
 *
 * Three rows: an interviewer bubble, an answer bubble, and another interviewer bubble.
 * Mirrors the typical Q→A→Q rhythm so the layout doesn't shift the moment real
 * messages land.
 *
 * Uses the shared <Skeleton> primitive — pure CSS pulse, no JS animation. Marked as a
 * polite live region (`aria-busy`) so screen readers announce the loading state once
 * instead of every pulse cycle.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function ChatSkeleton() {
  return (
    <div
      className="space-y-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading interview"
    >
      {/* Interviewer bubble — left aligned, ~70% width */}
      <div className="flex justify-start">
        <div className="w-[70%] max-w-md">
          <Skeleton className="h-3 w-20 mb-2" />
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Answer bubble — right aligned */}
      <div className="flex justify-end">
        <div className="w-[60%] max-w-md">
          <Skeleton className="h-3 w-12 mb-2 ml-auto" />
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Second interviewer bubble */}
      <div className="flex justify-start">
        <div className="w-[75%] max-w-md">
          <Skeleton className="h-3 w-20 mb-2" />
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
