import { type ReactNode } from "react";

interface InterviewLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

export function InterviewLayout({
  children,
  sidebar,
  header,
}: InterviewLayoutProps) {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {sidebar && (
        <aside className="w-60 border-r border-border bg-sidebar-background flex-shrink-0 overflow-y-auto">
          {sidebar}
        </aside>
      )}

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {header && (
          <header className="h-14 border-b border-border bg-background flex-shrink-0">
            {header}
          </header>
        )}

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
