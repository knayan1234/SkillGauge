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

import { Clock, FileText, MessageSquare, Trash2 } from "lucide-react";
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
  /**
   * Delete handler. When provided, a small trash icon appears on hover/focus and
   * fires this callback (which should orchestrate confirmation + the API call).
   * Omit for synthetic entries that have no server row to delete.
   */
  onDelete?: (id: string) => void;
}

export function ChatroomEntry({
  id,
  title,
  resumeFileName,
  createdAt,
  isActive,
  onSelect,
  onDelete,
}: ChatroomEntryProps) {
  const dateLabel = formatRelative(createdAt);
  const interactive = typeof onSelect === "function";

  // Visual state — entries live INSIDE the cream sidebar, so a pure-white `bg-card`
  // fill reads as "alien" against the warm surrounding. Switched to a translucent
  // warm-white that lets the sidebar's cream peek through faintly + an amber-tinted
  // border instead of neutral. Active state uses amber (the brand accent) so the
  // current chatroom matches the rest of the warm system. In dark mode the white fill is
  // dialed down to ~6% and the border becomes a faint light hairline so entries read as
  // subtle elevated surfaces over the dark sidebar, not glaring pale blocks.
  const className = [
    "p-3 transition-all duration-200",
    isActive
      ? "bg-amber-500/10 border-amber-500/40 shadow-sm shadow-amber-500/10"
      : "bg-white/55 dark:bg-white/[0.06] border-amber-900/10 dark:border-white/10",
    interactive
      ? "cursor-pointer hover:bg-amber-500/8 hover:border-amber-500/30 hover:-translate-y-0.5"
      : "cursor-default",
  ].join(" ");

  const showDelete = typeof onDelete === "function";

  const content = (
    <div className="flex items-start gap-2 pr-6">
      <MessageSquare className="h-4 w-4 text-amber-700 dark:text-amber-500 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">
            {title}
          </p>
          {isActive && (
            <span
              className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-primary"
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

  // The delete affordance must be a sibling of the main click target — nesting a real
  // <button> inside the open/select button would be invalid HTML. We wrap both in a
  // `relative group` so the trash icon's absolute positioning is scoped to this card
  // and the hover-reveal cascades from either child via group-hover/focus-within.
  if (interactive) {
    return (
      <div className="relative group">
        <button
          type="button"
          onClick={() => onSelect(id)}
          aria-current={isActive ? "true" : undefined}
          aria-label={`Open ${title} session${
            resumeFileName ? ` for résumé ${resumeFileName}` : ""
          }`}
          className="w-full text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Card className={className}>{content}</Card>
        </button>
        {showDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(id);
            }}
            aria-label={`Delete ${title}`}
            title="Delete chatroom"
            className="absolute top-2 right-2 p-1 rounded text-muted-foreground/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/60 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="relative group">
      <Card
        className={className}
        aria-current={isActive ? "true" : undefined}
      >
        {content}
      </Card>
      {showDelete && (
        <button
          type="button"
          onClick={() => onDelete(id)}
          aria-label={`Delete ${title}`}
          title="Delete chatroom"
          className="absolute top-2 right-2 p-1 rounded text-muted-foreground/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-destructive/60 transition-opacity"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
