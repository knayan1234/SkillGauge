"use client";

/**
 * InterviewLayout — sidebar (left) + header + main (right) shell for the interview view.
 *
 * Responsive behaviour:
 *   - **md+ (≥ 768px)**: persistent resizable sidebar. Drag handle on the right edge,
 *     width clamped to [SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH], persisted to localStorage.
 *   - **< md**: sidebar collapses into a slide-out drawer behind a hamburger button in
 *     the header. Tap a chatroom to open it; the drawer auto-dismisses on selection
 *     (not implemented inside the layout — that's the consumer's responsibility via
 *     `onNavigate` since the layout doesn't know which child is a clickable list).
 *
 * Accessibility:
 *   - Drawer is `role="dialog" aria-modal="true"` with `aria-label="Chat history"`.
 *   - The hamburger button has `aria-controls` + `aria-expanded` pointing at the drawer.
 *   - Escape closes the drawer.
 *   - Focus is restored to the hamburger button on close.
 *
 * Why not Radix Sheet: this uses the same Dialog primitive we already ship; pulling
 * Radix Sheet would add a peer dependency for a drawer-shaped dialog we can hand-roll
 * in 30 lines. If we add multiple sheet surfaces later, swap in then.
 */

import {
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";
import { Menu, X } from "lucide-react";

interface InterviewLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 520;
const SIDEBAR_DEFAULT_WIDTH = 240;
const STORAGE_KEY = "skillgauge.sidebarWidth";

export function InterviewLayout({
  children,
  sidebar,
  header,
}: InterviewLayoutProps) {
  const drawerId = useId();
  const [width, setWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<{
    dragging: boolean;
    startX: number;
    startWidth: number;
  }>({
    dragging: false,
    startX: 0,
    startWidth: SIDEBAR_DEFAULT_WIDTH,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = Number.parseInt(stored, 10);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, parsed),
      );
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWidth(clamped);
    }
  }, []);

  // Drag handlers — desktop sidebar resize.
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStateRef.current.dragging) return;
      const delta = e.clientX - dragStateRef.current.startX;
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(
          SIDEBAR_MIN_WIDTH,
          dragStateRef.current.startWidth + delta,
        ),
      );
      setWidth(next);
    }
    function onMouseUp() {
      if (!dragStateRef.current.dragging) return;
      dragStateRef.current.dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        window.localStorage.setItem(STORAGE_KEY, String(width));
      } catch {
        // localStorage may be unavailable (privacy mode, quota); silent skip.
      }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [width]);

  // Mobile drawer — Escape to close + restore focus to the hamburger.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        hamburgerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  function startDrag(e: React.MouseEvent<HTMLDivElement>) {
    dragStateRef.current = {
      dragging: true,
      startX: e.clientX,
      startWidth: width,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Desktop sidebar — hidden below md breakpoint; the drawer takes over there. */}
      {sidebar && (
        <>
          <aside
            className="hidden md:block border-r border-border sidebar-surface flex-shrink-0 overflow-y-auto"
            style={{ width: `${width}px` }}
            aria-label="Chat history"
          >
            {sidebar}
          </aside>
          {/* Desktop drag handle. Hidden on mobile (the drawer doesn't need a resize). */}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            tabIndex={0}
            onMouseDown={startDrag}
            className="hidden md:block w-1 bg-transparent hover:bg-primary/30 transition-colors cursor-col-resize flex-shrink-0 active:bg-primary/50"
          />
        </>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {header && (
          <header className="h-14 border-b border-border bg-background flex-shrink-0 flex items-center">
            {/* Mobile-only hamburger. Slot it before the consumer's header content
                so the menu button always sits at the leading edge. */}
            {sidebar && (
              <button
                ref={hamburgerRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open chat history"
                aria-controls={drawerId}
                aria-expanded={drawerOpen}
                className="md:hidden ml-3 mr-1 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
            <div className="flex-1 min-w-0">{header}</div>
          </header>
        )}

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>

      {/* Mobile drawer + scrim. Only mounts when sidebar is provided AND drawer is
          open — keeps the DOM minimal at rest. The scrim closes on click; the panel
          is its own region with an explicit close button for keyboard users. */}
      {sidebar && drawerOpen && (
        <>
          {/* Scrim — lower z than the panel, click-to-close. aria-hidden because the
              dialog announcement comes from the panel, not the backdrop. */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => {
              setDrawerOpen(false);
              hamburgerRef.current?.focus();
            }}
          />
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Chat history"
            className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[80%] max-w-[320px] sidebar-surface border-r border-border overflow-y-auto animate-slide-up"
          >
            <div className="sticky top-0 flex justify-end p-2 sidebar-surface backdrop-blur-sm border-b border-border/40">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  hamburgerRef.current?.focus();
                }}
                aria-label="Close chat history"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {sidebar}
          </div>
        </>
      )}
    </div>
  );
}
