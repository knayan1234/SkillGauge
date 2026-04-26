"use client";

/**
 * Celebration card shown at the end of a round.
 *
 * Single concern: render the end-of-round summary + the three CTAs (start next round
 * / export PDF / new session). The interview page composes this with parent-supplied
 * callbacks — the card itself doesn't know how to start a session or talk to the BE.
 *
 * Average score is computed locally because it's a derived value the parent doesn't
 * otherwise need; pulling that calculation up would force the parent to know about
 * feedback shape.
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreRadial } from "@/components/ScoreRadial";
import { exportSessionPdf } from "@/lib/exportPdf";
import type { Message, Session } from "@/services/api";

interface CompletionCardProps {
  session: Session;
  messages: Message[];
  currentRound: number;
  onStartNew: () => void;
  onStartNextRound: () => void;
}

export function CompletionCard({
  session,
  messages,
  currentRound,
  onStartNew,
  onStartNextRound,
}: CompletionCardProps) {
  // Average score across feedback messages. Memoised because the parent re-renders
  // on every scroll/typing tick.
  const averageScore = useMemo(() => {
    const scores = messages
      .filter(
        (m): m is Message & { feedback: { score: number; strengths: string[]; improvements: string[] } } =>
          m.type === "feedback" && typeof m.feedback?.score === "number",
      )
      .map((m) => m.feedback.score);
    if (scores.length === 0) return null;
    return Math.round((scores.reduce((s, n) => s + n, 0) / scores.length) * 10) / 10;
  }, [messages]);

  const nextRoundNumber = currentRound + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-8"
    >
      <Card className="border-primary/20 bg-card">
        <CardContent className="p-6 text-center">
          {averageScore !== null ? (
            <>
              <div className="mx-auto mb-3">
                {/* Round to nearest int for the radial display — the decimal lives in
                    the caption below for users who care about the exact value. */}
                <ScoreRadial score={Math.round(averageScore)} size={120} />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Average score: {averageScore.toFixed(1)} / 10
              </p>
            </>
          ) : (
            <div className="h-10 w-10 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-primary/80" />
            </div>
          )}
          <h3 className="text-base font-semibold text-foreground mb-2">
            Round {currentRound} Complete
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Great job! Round {nextRoundNumber} ramps the difficulty and digs into
            the areas you can improve from this round.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              onClick={onStartNextRound}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Round {nextRoundNumber}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => exportSessionPdf({ session, messages })}
              aria-label="Download interview transcript as PDF"
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={onStartNew}>
              New Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
