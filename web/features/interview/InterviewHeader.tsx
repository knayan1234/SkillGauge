"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { STORAGE_KEYS } from "@/lib/storageKeys";

interface InterviewHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
  isActive: boolean;
}

export function InterviewHeader({
  title,
  currentQuestion,
  totalQuestions,
  isActive,
}: InterviewHeaderProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleHome = () => {
    if (isActive) {
      setConfirmOpen(true);
    } else {
      router.push("/");
    }
  };

  const confirmHome = () => {
    sessionStorage.removeItem(STORAGE_KEYS.session.active);
    setConfirmOpen(false);
    router.push("/");
  };

  return (
    <div className="h-full flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-xs text-muted-foreground">
          Question {currentQuestion + 1} of {totalQuestions}
        </div>
        {/* Phase 1.6a — auth-aware UserMenu also lives in the interview shell so Sign
            out is reachable without leaving the interview view. */}
        <UserMenu />
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleHome}
          aria-label="Go home"
        >
          <Home className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave this interview?</DialogTitle>
            <DialogDescription>
              Your progress is saved on the server. You can continue later, but
              this chat view will reset if you leave now.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Stay
            </Button>
            <Button onClick={confirmHome}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
