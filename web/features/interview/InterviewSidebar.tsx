"use client";

/**
 * InterviewSidebar — the left rail in the interview view.
 *
 * Three concerns, top to bottom:
 *   1. Brand mark with home navigation (mid-session navigation triggers a confirm).
 *   2. Resume-in-use card with a "View" dialog showing the parsed text the BE received.
 *   3. **Chatroom list** — the live session plus any archived snapshots from
 *      `localStorage[archived_sessions]`, rendered as a grouped list of
 *      [ChatroomEntry](../../components/ChatroomEntry.tsx) cards.
 *
 * Data sources:
 *   - **Active session**: passed in via props (`sessionTitle`, `resumeFileName`).
 *     Always shown, always at the top, marked as active.
 *   - **Archived sessions**: read from `localStorage[STORAGE_KEYS.session.archived]` on
 *     mount. Each archive entry has shape
 *     `{ archivedAt, resume: <stringified {fileName, content}>, jobDescription, options }`
 *     written by SessionSetupForm when the user starts a new session over an active one.
 *
 * Why localStorage today: the real `GET /api/sessions` list endpoint doesn't exist yet
 * The localStorage archive is a UX safety net so swapping resumes mid-session
 * doesn't silently drop the prior context. Once authenticated, the component reads
 * from the server-backed `listSessions()` endpoint instead — the local archive is
 * the offline / unauth fallback.
 *
 * Click behavior on archived entries: today they're non-interactive (no `onSelect`)
 * because there's no server-side state to navigate to. Once the list endpoint exists,
 * clicking will route to `/interview?session=<id>` and hydrate from the server.
 *
 * SSR note: `useEffect` reads localStorage on mount. Initial render shows only the
 * active session — archived entries hydrate on first client render. This is fine for
 * a route that's already client-only.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Eye } from "lucide-react";
import { SkillGaugeLogo } from "@/components/SkillGaugeLogo";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChatroomEntry,
  type ChatroomEntryData,
} from "@/components/ChatroomEntry";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import { deleteSession, listSessions } from "@/services/api";
import { groupSessionsByResumeAndDay } from "@/lib/sessionGrouping";

interface InterviewSidebarProps {
  sessionTitle: string;
  resumeFileName: string | null;
  /**
   * Parsed plain-text resume content from the BE session response. Displayed in the
   * "View resume" dialog. Optional because legacy archived sessions (pre-parsing) may
   * not have it — those entries show "Resume content not available." instead.
   */
  resumeContent: string | null;
  isActive: boolean;
}

/**
 * Shape of one entry in `localStorage[archived_sessions]`. Written by SessionSetupForm
 * when the user starts a new interview over an active one. Both `resume` and `options`
 * are stringified JSON because they were originally read from sessionStorage as strings;
 * we re-parse them here when reading.
 */
interface ArchiveDoc {
  archivedAt: string;
  resume: string | null;
  jobDescription: string | null;
  options: string | null;
}

/**
 * Read + parse the localStorage archive once on mount. Returns an empty list during SSR
 * (no `window`) and on parse failure (defensive — we'd rather show no list than crash
 * the whole sidebar over a corrupt storage entry).
 */
function readArchivedChatrooms(): ChatroomEntryData[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session.archived);
    if (!raw) return [];
    const docs = JSON.parse(raw) as ArchiveDoc[];
    return docs.map((doc, idx) => {
      // resume is itself a stringified {resumeFileName, resumeContent} payload.
      let resumeFileName: string | null = null;
      if (doc.resume) {
        try {
          resumeFileName =
            (JSON.parse(doc.resume) as { resumeFileName?: string })
              .resumeFileName ?? null;
        } catch {
          resumeFileName = null;
        }
      }
      // Title is best-effort: try to read style from options, fall back to a generic.
      let title = "Past interview";
      if (doc.options) {
        try {
          const opts = JSON.parse(doc.options) as {
            interviewStyle?: string;
            roleLevel?: string;
          };
          const role = opts.roleLevel
            ? opts.roleLevel[0].toUpperCase() + opts.roleLevel.slice(1)
            : "";
          const style = opts.interviewStyle
            ? opts.interviewStyle[0].toUpperCase() +
              opts.interviewStyle.slice(1)
            : "";
          if (role || style) title = `${role} ${style} Interview`.trim();
        } catch {
          // keep fallback title
        }
      }
      return {
        id: `archive-${idx}-${doc.archivedAt}`,
        title,
        resumeFileName,
        createdAt: doc.archivedAt,
        isActive: false,
      };
    });
  } catch {
    return [];
  }
}

export function InterviewSidebar({
  sessionTitle,
  resumeFileName,
  resumeContent,
  isActive,
}: InterviewSidebarProps) {
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  // Hydrate archived chatrooms on mount. `useSyncExternalStore` would be the more
  // modern pattern, but `readArchivedChatrooms()` returns a fresh array reference on
  // every call — React would treat that as a perpetual store change and loop forever.
  // useState + useEffect avoids the loop and the SSR hydration mismatch (initial render
  // matches the server's empty list; the client effect populates after hydration).
  const [archived, setArchived] = useState<ChatroomEntryData[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArchived(readArchivedChatrooms());
  }, []);

  // Server-side session list. Once authenticated, this replaces the local archive
  // for past sessions. Errors degrade silently — the local archive is the fallback
  // when the user is unauth, offline, or hitting a stale cookie.
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const { data: serverSessions = [] } = useQuery({
    queryKey: ["sessions", "list"] as const,
    queryFn: listSessions,
    staleTime: 60_000, // refresh every minute; cheap query
    retry: false,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions", "list"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Session deleted");
    },
    onError: (err) => {
      toast.error("Couldn't delete session", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    },
  });

  // Compose the chatroom list: live session first, then server sessions, then any
  // localStorage archives that don't appear in the server list (old entries from
  // pre-Phase-6 sessions). Server sessions take precedence — they're authoritative.
  const liveEntry: ChatroomEntryData = {
    id: "live",
    title: sessionTitle,
    resumeFileName,
    createdAt: new Date().toISOString(),
    isActive,
  };

  const serverEntries: ChatroomEntryData[] = serverSessions.map((s) => ({
    id: s.id,
    title: s.title,
    resumeFileName: s.resumeFileName ?? null,
    createdAt: s.createdAt,
    isActive: false,
  }));

  // Filter out the live session's id from server entries to avoid duplicate display.
  // The live session has id "live" only on the FE; the server's id may not be known
  // here yet (the parent component owns it), so this dedup is title-based as a
  // pragmatic fallback. If both sources show the same title, we trust server.
  const liveTitle = sessionTitle;
  const dedupedServer = serverEntries.filter((s) => s.title !== liveTitle);

  const sortedArchived = [...archived].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  // localStorage archive only contributes entries that aren't already in the server
  // list — server is authoritative once it ships data.
  const archiveOnlyExtras = serverEntries.length > 0 ? [] : sortedArchived;

  const chatrooms: ChatroomEntryData[] = [
    liveEntry,
    ...dedupedServer,
    ...archiveOnlyExtras,
  ];

  const grouped = groupSessionsByResumeAndDay(chatrooms);

  const goHome = () => {
    if (isActive) {
      setConfirmLeave(true);
    } else {
      router.push("/");
    }
  };

  const confirmHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.session.active);
    setConfirmLeave(false);
    router.push("/");
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4">
      {/* No brand mark here — `<BrandLink />` lives in the interview shell's header.
          The sidebar is dedicated entirely to the resume context + chat history. */}

      {resumeFileName && (
        <Card className="p-3 mb-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Resume in use
              </p>
              <p className="text-xs font-semibold text-foreground truncate">
                {resumeFileName}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 mt-1 text-xs"
                onClick={() => setResumeOpen(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">
            Chat history
          </p>
          {serverEntries.length > 0 && (
            <p
              className="text-xs text-muted-foreground/70"
              title="Stored on the server; synced across devices."
            >
              {serverEntries.length} saved
            </p>
          )}
          {serverEntries.length === 0 && archived.length > 0 && (
            <p
              className="text-xs text-muted-foreground/70"
              title="Archived sessions stored locally; will sync to the server on next load when authenticated."
            >
              {archived.length} archived
            </p>
          )}
        </div>
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
                  {bucket.entries.map((c) => {
                    // Live + localStorage archives have synthetic ids ("live", "archive-…")
                    // that don't exist in the BE — only server entries are clickable +
                    // deletable.
                    const isServerEntry =
                      c.id !== "live" && !c.id.startsWith("archive-");
                    return (
                      <ChatroomEntry
                        key={c.id}
                        id={c.id}
                        title={c.title}
                        resumeFileName={c.resumeFileName}
                        createdAt={c.createdAt}
                        isActive={c.isActive}
                        onSelect={
                          isServerEntry && !c.isActive
                            ? (id) => router.push(`/interview?session=${id}`)
                            : undefined
                        }
                        onDelete={
                          isServerEntry
                            ? (id) => setPendingDelete({ id, title: c.title })
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground/60 mt-4 pt-4 border-t border-border">
        Answer thoughtfully and take your time
      </div>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this interview?</DialogTitle>
            <DialogDescription>
              Your progress so far is saved on the server, but the chat view
              here will reset. You can resume from a new session anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              Stay
            </Button>
            <Button onClick={confirmHome}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{resumeFileName ?? "Resume"}</DialogTitle>
            <DialogDescription>
              Text snapshot sent to the interviewer for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono">
            {resumeContent || "Resume content not available."}
          </div>
        </DialogContent>
      </Dialog>

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
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
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
                    // If the user just deleted the chatroom they're viewing, send
                    // them back to the workspace so they aren't stuck on a 404.
                    router.push("/sessions");
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
