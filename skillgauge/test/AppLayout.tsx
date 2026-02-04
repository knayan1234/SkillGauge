import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center">
              <div className="h-3 w-3 rounded-sm bg-primary/60" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              SkillGauge
            </span>
          </div>
        </div>
      </header>
      <main className="pt-14">
        {children}
      </main>
    </div>
  );
}
