import { Loader2 } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">AI is thinking...</span>
      </div>
    </div>
  );
}
