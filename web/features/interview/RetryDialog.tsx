"use client";

/**
 * Re-answer dialog. Lets the user submit a fresh attempt at a previously-graded
 * question; the original answer + feedback stay in the transcript.
 *
 * Single responsibility: own the dialog UI + the local form state. The parent owns
 * the network call (passed in as `onSubmit`) and the resulting transcript update.
 *
 * Why a dialog (not an inline form below the feedback bubble): the user has already
 * scrolled past the question by the time they decide to retry. A modal pulls the
 * question text back into focus and isolates the retry from the chat flow.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export interface RetryTarget {
  questionIndex: number;
  questionContent: string;
}

interface RetryDialogProps {
  // Null means "closed". When set, the dialog opens with this target's question.
  target: RetryTarget | null;
  onClose: () => void;
  // Returns the parent's mutation promise so we can show a submitting state and
  // close on success / leave open on failure.
  onSubmit: (questionIndex: number, answer: string) => Promise<void>;
}

export function RetryDialog({ target, onClose, onSubmit }: RetryDialogProps) {
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = target !== null;

  const handleSubmit = async () => {
    if (!target || !answer.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(target.questionIndex, answer);
      // Successful submit — clear local state then close. The parent's mutation
      // will have already appended the new rows to the transcript.
      setAnswer("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Block dismiss while submitting so we don't leave a request hanging.
        if (!next && !submitting) {
          setAnswer("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Try this question again</DialogTitle>
          <DialogDescription>
            Your original answer stays in the transcript. The retry will be graded
            fresh and appended at the bottom.
          </DialogDescription>
        </DialogHeader>
        {target && (
          <div className="space-y-3">
            <div className="rounded-md bg-muted/40 border border-border/50 p-3 text-sm text-foreground">
              {target.questionContent}
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your fresh attempt here..."
              rows={6}
              disabled={submitting}
            />
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              if (!submitting) {
                setAnswer("");
                onClose();
              }
            }}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!answer.trim() || submitting}
          >
            {submitting ? "Re-grading…" : "Submit retry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
