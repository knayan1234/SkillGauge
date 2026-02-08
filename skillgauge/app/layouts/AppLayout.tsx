import { type ReactNode } from "react";
import { Brain } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              SkillGauge
            </span>
          </div>
        </div>
      </header>
      <main className="pt-14">{children}</main>
    </div>
  );
}
