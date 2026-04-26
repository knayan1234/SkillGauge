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
 * (Phase 3 territory). The archive is a UX safety net so swapping résumés mid-session
 * doesn't silently drop the prior context. When the server endpoint ships, this
 * component swaps its data source from `useArchivedSessions()` to a `useQuery` and the
 * presentation layer (ChatroomEntry) doesn't change.
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
import { Brain, FileText, Eye } from "lucide-react";
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

interface InterviewSidebarProps {
  sessionTitle: string;
  resumeFileName: string | null;
  /**
   * Parsed plain-text résumé content from the BE session response. Displayed in the
   * "View résumé" dialog. Optional because legacy archived sessions (pre-parsing) may
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
  // Hydrate archived chatrooms on mount. Empty during SSR + first render so the
  // component matches the server-rendered output exactly (no hydration mismatch).
  const [archived, setArchived] = useState<ChatroomEntryData[]>([]);
  useEffect(() => {
    setArchived(readArchivedChatrooms());
  }, []);

  // Compose the chatroom list: live session first, then archives sorted by date desc.
  const liveEntry: ChatroomEntryData = {
    id: "live",
    title: sessionTitle,
    resumeFileName,
    createdAt: new Date().toISOString(),
    isActive,
  };
  const sortedArchived = [...archived].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const chatrooms: ChatroomEntryData[] = [liveEntry, ...sortedArchived];

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
    <div className="h-full flex flex-col p-4">
      <button
        type="button"
        onClick={goHome}
        className="flex items-center gap-2 mb-6 text-left hover:opacity-80 transition-opacity"
        aria-label="Go home"
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">SkillGauge</h2>
      </button>

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

      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">
            Chat history
          </p>
          {archived.length > 0 && (
            <p
              className="text-xs text-muted-foreground/70"
              title="Archived sessions are stored locally until the server-side history list ships."
            >
              {archived.length} archived
            </p>
          )}
        </div>
        <div className="space-y-2">
          {chatrooms.map((c) => (
            <ChatroomEntry
              key={c.id}
              id={c.id}
              title={c.title}
              resumeFileName={c.resumeFileName}
              createdAt={c.createdAt}
              isActive={c.isActive}
              // Archived entries today are non-interactive — no server route exists yet
              // to load a prior session. Active entry is also non-interactive (already
              // viewing it). Both render as static cards.
            />
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
    </div>
  );
}
