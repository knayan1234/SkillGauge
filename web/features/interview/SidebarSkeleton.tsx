/**
 * SidebarSkeleton — placeholder rows for the chatroom sidebar while a session loads.
 *
 * Mirrors the real `InterviewSidebar` shape: brand mark at the top, "Chat history"
 * eyebrow, then 3-4 chatroom-entry rows. The visual cadence matches the live sidebar so
 * the layout doesn't shift when data lands.
 *
 * Pure CSS pulse via the shared <Skeleton> primitive. Marked aria-busy so assistive
 * tech announces a single "loading" state rather than every pulse cycle.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <div
      className="h-full flex flex-col p-4"
      role="status"
      aria-busy="true"
      aria-label="Loading session list"
    >
      {/* Brand mark */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* "Chat history" eyebrow */}
      <Skeleton className="h-3 w-20 mb-3" />

      {/* Résumé group header + 2 entries */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-32" />
          <Skeleton className="h-2 w-12 mb-1" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-2 w-14 mb-1" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
