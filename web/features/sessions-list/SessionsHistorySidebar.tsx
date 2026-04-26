"use client";

/**
 * SessionsHistorySidebar — the chatroom list shown next to authenticated landing pages.
 *
 * Mirrors the grouping of [InterviewSidebar](../interview/InterviewSidebar.tsx) (résumé →
 * day bucket) but without the interview-specific bits (leave-session confirm, "Resume in
 * use" dialog). Clicking an entry routes to `/interview?session=<id>` which hydrates that
 * past session's transcript into the interview view in read-only or continue mode based
 * on the session's status.
 *
 * Data source:
 *   - `GET /api/sessions` via `listSessions()` — authenticated; returns the user's full
 *     session history newest-first.
 *
 * Empty state: brand new accounts see an inline empty-state pointing them at the
 * "Start new interview" CTA in the main panel.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, MessageSquare } from "lucide-react";
import { SkillGaugeLogo } from "@/components/SkillGaugeLogo";
import { toast } from "sonner";
import { ChatroomEntry, type ChatroomEntryData } from "@/components/ChatroomEntry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteSession, listSessions } from "@/services/api";
import { groupSessionsByResumeAndDay } from "@/lib/sessionGrouping";

interface SessionsHistorySidebarProps {
  /** Optional id of the session currently being viewed. Drives the active highlight. */
  activeSessionId?: string;
}

export function SessionsHistorySidebar({
  activeSessionId,
}: SessionsHistorySidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["sessions", "list"] as const,
    queryFn: listSessions,
    staleTime: 60_000,
    retry: false,
  });

  // Delete mutation — invalidates the sessions list + dashboard caches on success so
  // both the sidebar and the dashboard's "My Résumés" panel reflect the removal.
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Session deleted", {
        description: "The chatroom and its transcript are gone.",
      });
    },
    onError: (err) => {
      toast.error("Couldn't delete session", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  const entries: ChatroomEntryData[] = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    resumeFileName: s.resumeFileName ?? null,
    createdAt: s.createdAt,
    isActive: activeSessionId === s.id,
  }));

  const grouped = groupSessionsByResumeAndDay(entries);

  return (
    <div className="h-full flex flex-col p-4">
      {/* No brand mark here — `<BrandLink />` lives in the workspace header. The
          sidebar is now dedicated entirely to the chat-history list, with no chrome
          duplication. */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground">Chat history</p>
        {sessions.length > 0 && (
          <p
            className="text-xs text-muted-foreground/70"
            title="Stored on the server; synced across devices."
          >
            {sessions.length} saved
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <p className="text-xs text-muted-foreground/70 px-1">Loading…</p>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="px-1 py-4 space-y-2">
            <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground">
              No sessions yet. Start one from the main panel — it will appear
              here grouped by résumé and date.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.resumeFileName} className="space-y-2">
              <div className="flex items-center gap-1.5 px-1">
                <FileText className="h-3 w-3 text-muted-foreground/70 flex-shrink-0" />
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80 truncate"
                  title={group.resumeFileName}
                >
                  {group.resumeFileName}
                </p>
              </div>
              {group.buckets.map((bucket) => (
                <div key={bucket.label} className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground/60 px-1">
                    {bucket.label}
                  </p>
                  {bucket.entries.map((c) => (
                    <ChatroomEntry
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      resumeFileName={c.resumeFileName}
                      createdAt={c.createdAt}
                      isActive={c.isActive}
                      onSelect={(id) => router.push(`/interview?session=${id}`)}
                      onDelete={(id) =>
                        setPendingDelete({ id, title: c.title })
                      }
                    />
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chatroom?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.title ?? "This session"} and its full transcript
              will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!pendingDelete) return;
                const idToDelete = pendingDelete.id;
                deleteMutation.mutate(idToDelete, {
                  onSuccess: () => {
                    setPendingDelete(null);
                    // If the user was viewing the just-deleted session, route them
                    // back to the workspace so they're not stuck on a 404 surface.
                    if (activeSessionId === idToDelete) {
                      router.push("/sessions");
                    }
                  },
                });
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
