import { ReactNode } from 'react';

interface InterviewLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  header?: ReactNode;
}

export function InterviewLayout({ children, sidebar, header }: InterviewLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {sidebar && (
        <aside className="w-60 border-r border-border bg-sidebar-background flex-shrink-0">
          {sidebar}
        </aside>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        {header && (
          <header className="h-14 border-b border-border bg-background flex-shrink-0">
            {header}
          </header>
        )}
        
        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
