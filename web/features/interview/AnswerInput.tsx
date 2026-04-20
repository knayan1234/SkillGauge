"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";

interface AnswerInputProps {
  onSubmit: (answer: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export function AnswerInput({
  onSubmit,
  isLoading,
  isDisabled,
}: AnswerInputProps) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!answer.trim() || isLoading || isDisabled) {
      return;
    }

    onSubmit(answer);
    setAnswer("");
  };

  return (
    <div className="border-t border-border bg-background/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={
              isDisabled ? "Interview complete ✓" : "Type your answer here..."
            }
            disabled={isLoading || isDisabled}
            rows={3}
            className="pr-24 resize-none border-border/50 bg-background/80 focus:bg-background transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSubmit(e);
              }
            }}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                <span>AI thinking...</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={!answer.trim() || isLoading || isDisabled}
              size="sm"
              className="h-8 px-3 bg-primary hover:bg-primary/90 shadow-sm"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">
            Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">
            Enter
          </kbd>{" "}
          to send
        </p>
      </form>
    </div>
  );
}
