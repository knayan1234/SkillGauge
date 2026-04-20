"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, MessageSquare, Clock, FileText, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/storageKeys";

interface InterviewSidebarProps {
  sessionTitle: string;
  resumeFileName: string | null;
  isActive: boolean;
}

export function InterviewSidebar({
  sessionTitle,
  resumeFileName,
  isActive,
}: InterviewSidebarProps) {
  const router = useRouter();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);

  const chatHistories = [
    {
      id: 1,
      title: sessionTitle,
      date: "Today",
      active: true,
    },
  ];

  const goHome = () => {
    if (isActive) {
      setConfirmLeave(true);
    } else {
      router.push("/");
    }
  };

  const confirmHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.session.active);
    setConfirmLeave(false);
    router.push("/");
  };

  const resumeContent = (() => {
    if (typeof window === "undefined") return "";
    const raw = sessionStorage.getItem(STORAGE_KEYS.session.id);
    if (!raw) return "";
    try {
      return (JSON.parse(raw) as { resumeContent?: string }).resumeContent ?? "";
    } catch {
      return "";
    }
  })();

  return (
    <div className="h-full flex flex-col p-4">
      <button
        type="button"
        onClick={goHome}
        className="flex items-center gap-2 mb-6 text-left hover:opacity-80 transition-opacity"
        aria-label="Go home"
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground">SkillGauge</h2>
      </button>

      {resumeFileName && (
        <Card className="p-3 mb-4 bg-muted/50">
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Resume in use
              </p>
              <p className="text-xs font-semibold text-foreground truncate">
                {resumeFileName}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 mt-1 text-xs"
                onClick={() => setResumeOpen(true)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground mb-3">
          Chat History
        </p>
        <div className="space-y-2">
          {chatHistories.map((chat) => (
            <Card
              key={chat.id}
              className={`p-3 cursor-pointer transition-all hover:bg-primary/5 ${
                chat.active
                  ? "bg-primary/10 border-primary/20"
                  : "bg-card border-border"
              }`}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {chat.title}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{chat.date}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground/60 mt-4 pt-4 border-t border-border">
        Answer thoughtfully and take your time
      </div>

      <Dialog open={confirmLeave} onOpenChange={setConfirmLeave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this interview?</DialogTitle>
            <DialogDescription>
              Your progress so far is saved on the server, but the chat view
              here will reset. You can resume from a new session anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmLeave(false)}>
              Stay
            </Button>
            <Button onClick={confirmHome}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resumeOpen} onOpenChange={setResumeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{resumeFileName ?? "Resume"}</DialogTitle>
            <DialogDescription>
              Text snapshot sent to the interviewer for this session.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono">
            {resumeContent || "Resume content not available."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
