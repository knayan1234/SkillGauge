"use client";

/**
 * InterviewLayout — sidebar (left) + header + main (right) shell for the interview view.
 *
 * Responsive behaviour:
 *   - **md+ (≥ 768px)**: persistent resizable sidebar. Collapse toggle at the top of
 *     the sidebar hides it to a 36px strip; the strip's expand icon brings it back.
 *     Drag handle on the right edge resizes width [SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH].
 *     Both width and collapsed state are persisted to localStorage.
 *   - **< md**: sidebar collapses into a slide-out drawer behind a hamburger button in
 *     the header.
 *
 * Scroll architecture (desktop):
 *   The aside is `flex flex-col` with no overflow set — it never scrolls itself.
 *   Inside, a `flex-1 min-h-0 flex flex-col` wrapper passes a concrete flex height to
 *   the sidebar child. The sidebar uses `flex-1 min-h-0 flex flex-col` on its root and
 *   `flex-1 min-h-0 overflow-y-auto` on its inner list. This is the correct pattern for
 *   nested flex scroll without percentage-height ambiguity.
 */

import {
  useEffect,
  useRef,
  useState,
  useId,
  type ReactNode,
} from "react";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface InterviewLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 520;
const SIDEBAR_DEFAULT_WIDTH = 240;
const STORAGE_KEY = "skillgauge.sidebarWidth";
const STORAGE_KEY_COLLAPSED = "skillgauge.sidebarCollapsed";

export function InterviewLayout({
  children,
  sidebar,
  header,
}: InterviewLayoutProps) {
  const drawerId = useId();
  const [width, setWidth] = useState<number>(SIDEBAR_DEFAULT_WIDTH);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
    if (stored) {
      const parsed = Number.parseInt(stored, 10);
      if (Number.isFinite(parsed)) {
        const clamped = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, parsed));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWidth(clamped);
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(window.localStorage.getItem(STORAGE_KEY_COLLAPSED) === "true");
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    try { window.localStorage.setItem(STORAGE_KEY_COLLAPSED, String(next)); } catch { /* ignore */ }
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragStateRef.current.dragging) return;
      const delta = e.clientX - dragStateRef.current.startX;
      const next = Math.min(
        SIDEBAR_MAX_WIDTH,
        Math.max(SIDEBAR_MIN_WIDTH, dragStateRef.current.startWidth + delta),
      );
      setWidth(next);
    }
    function onMouseUp() {
      if (!dragStateRef.current.dragging) return;
      dragStateRef.current.dragging = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try { window.localStorage.setItem(STORAGE_KEY, String(width)); } catch { /* ignore */ }
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [width]);

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
    <div className="h-dvh bg-background flex overflow-hidden">

      {sidebar && (
        <>
          {collapsed ? (
            /* Collapsed: slim 36px strip with expand icon */
            <div className="hidden md:flex flex-col items-center pt-3 w-9 flex-shrink-0 border-r border-border sidebar-surface">
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              {/*
               * Aside: flex column, no overflow — never scrolls itself.
               * The sidebar child owns its own internal scroll via flex-1 min-h-0.
               */}
              <aside
                className="hidden md:flex flex-col flex-shrink-0 border-r border-border sidebar-surface"
                style={{ width: `${width}px` }}
                aria-label="Chat history"
              >
                {/* Collapse button row — fixed height, never scrolls away */}
                <div className="flex-shrink-0 flex justify-end px-2 pt-2 pb-0">
                  <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label="Collapse sidebar"
                    title="Collapse sidebar"
                    className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {/*
                 * flex-1 min-h-0 flex flex-col: gives the sidebar child a concrete
                 * flex height so it can use flex-1 on its own root instead of h-full.
                 */}
                <div className="flex-1 min-h-0 flex flex-col">
                  {sidebar}
                </div>
              </aside>

              {/* Drag handle — desktop only */}
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize sidebar"
                tabIndex={0}
                onMouseDown={startDrag}
                className="hidden md:block w-1 flex-shrink-0 bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors cursor-col-resize"
              />
            </>
          )}
        </>
      )}

      {/* Main area: header + content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {header && (
          <header className="h-14 flex-shrink-0 border-b border-border bg-background flex items-center">
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
        <main className="flex-1 overflow-hidden min-h-0">{children}</main>
      </div>

      {/* Mobile drawer */}
      {sidebar && drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => { setDrawerOpen(false); hamburgerRef.current?.focus(); }}
          />
          <div
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Chat history"
            className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-[80%] max-w-[320px] flex flex-col sidebar-surface border-r border-border animate-slide-up"
          >
            {/* Drawer close button */}
            <div className="flex-shrink-0 flex justify-end p-2 border-b border-border/40">
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); hamburgerRef.current?.focus(); }}
                aria-label="Close chat history"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            {/* flex-1 min-h-0 flex flex-col: same pattern as desktop aside */}
            <div className="flex-1 min-h-0 flex flex-col">
              {sidebar}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
