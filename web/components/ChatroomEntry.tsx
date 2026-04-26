"use client";

/**
 * ChatroomEntry — one entry in the interview-sidebar chatroom list.
 *
 * Each entry represents a session (live or archived) presented as a "chatroom" the user
 * can return to. Today's data source is the localStorage archive plus the active session
 * passed in via props; once the server-side `GET /api/sessions` list endpoint exists,
 * the same component is reused with that data — no shape change.
 *
 * Render shape:
 *   - Active entry gets a tinted background + a subtle dot indicator so the user knows
 *     which chatroom is the one they're currently in.
 *   - Resume filename rides under the title in muted text — it's the primary grouping
 *     dimension users navigate by ("which interview was for which résumé?").
 *   - Date in human-relative form ("2 hours ago", "Yesterday") via formatRelative.
 *   - The whole Card is a button when an onClick is provided. Without one (today's
 *     archived entries — there's no real session to load yet), it renders as a static
 *     Card so it doesn't appear interactive.
 *
 * Why no dropdown / context-menu yet: a future "Delete" / "Pin" affordance would slot
 * in here when needed. For now, fewer affordances = clearer affordances.
 */

import { Clock, FileText, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatRelative } from "@/lib/relativeTime";

export interface ChatroomEntryData {
  /** Stable key for React lists. Use the BE session id when available; archive index otherwise. */
  id: string;
  /** Display title — typically the session's auto-generated "Mid Mixed Interview" string. */
  title: string;
  /** Resume filename associated with this session. May be unknown for legacy archives. */
  resumeFileName: string | null;
  /** ISO timestamp used to render the relative date. */
  createdAt: string;
  /** Whether this is the user's current live session. Drives the visual highlight. */
  isActive: boolean;
}

interface ChatroomEntryProps extends ChatroomEntryData {
  /**
   * Click handler. Omit for static (non-interactive) entries — the Card won't get
   * cursor styling or keyboard focus in that case. Useful for archived entries today
   * since we can't yet route to a server-side session view.
   */
  onSelect?: (id: string) => void;
}

export function ChatroomEntry({
  id,
  title,
  resumeFileName,
  createdAt,
  isActive,
  onSelect,
}: ChatroomEntryProps) {
  const dateLabel = formatRelative(createdAt);
  const interactive = typeof onSelect === "function";

  // Tailwind classes for visual state. Active = tinted + ring; interactive = pointer.
  const className = [
    "p-3 transition-all",
    isActive
      ? "bg-primary/10 border-primary/30"
      : "bg-card border-border",
    interactive ? "cursor-pointer hover:bg-primary/5" : "cursor-default",
  ].join(" ");

  const content = (
    <div className="flex items-start gap-2">
      <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">
            {title}
          </p>
          {isActive && (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-primary"
              aria-label="Active session"
              title="Active session"
            />
          )}
        </div>
        {resumeFileName && (
          <div className="flex items-center gap-1 mt-1">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground truncate">
              {resumeFileName}
            </p>
          </div>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{dateLabel}</p>
        </div>
      </div>
    </div>
  );

  if (interactive) {
    return (
      <Card className={className} onClick={() => onSelect(id)} role="button">
        {content}
      </Card>
    );
  }
  return <Card className={className}>{content}</Card>;
}
