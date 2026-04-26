"use client";

import { CheckCircle, RefreshCw, TrendingUp, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";
import { ScoreRadial } from "@/components/ScoreRadial";
import { RubricInfo } from "@/components/RubricInfo";
import { Button } from "@/components/ui/button";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

interface MessageBubbleProps {
  type: "question" | "answer" | "feedback";
  content: string;
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
  // Optional tag pills shown under questions. Today these are derived FE-side from
  // session options (interviewStyle + roleLevel) by the parent — quick visual cues
  // about what the question is targeting without changing the LLM contract.
  tags?: string[];
  // When the parent passes `onRetry`, the feedback bubble shows a "Try again"
  // affordance that re-grades a fresh attempt at the same question. Optional so
  // the bubble keeps working in contexts (like a read-only past-session view) that
  // shouldn't expose retries.
  onRetry?: () => void;
}

// Shared entrance animation for every bubble. y=8 → y=0 is intentionally subtle —
// strong enough to draw the eye to the new bubble, restrained enough not to feel
// like a chat app trying to be a slot machine. duration: 0.25s reads as "fast" while
// staying smooth on low-end hardware.
const ENTRANCE_TRANSITION = {
  duration: 0.25,
  ease: "easeOut",
} as const;

export function MessageBubble({
  type,
  content,
  feedback,
  tags,
  onRetry,
}: MessageBubbleProps) {
  // TTS for the interviewer's voice. Hooked at the bubble level so each question
  // gets its own play/stop control independent of other bubbles.
  const tts = useSpeechSynthesis();

  if (type === "question") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ENTRANCE_TRANSITION}
        className="flex justify-start"
      >
        <div className="max-w-[80%]">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs text-muted-foreground">Interviewer</div>
            {tts.isSupported && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() =>
                  tts.isSpeaking ? tts.stop() : tts.speak(content)
                }
                aria-label={tts.isSpeaking ? "Stop reading" : "Read question aloud"}
                title={tts.isSpeaking ? "Stop reading" : "Read question aloud"}
              >
                {tts.isSpeaking ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
          </div>
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4">
              <Markdown content={content} />
              {tags && tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted/70 text-muted-foreground text-[10px] font-medium px-2 py-0.5 capitalize"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  if (type === "answer") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={ENTRANCE_TRANSITION}
        className="flex justify-end"
      >
        <div className="max-w-[80%]">
          <div className="text-xs text-muted-foreground mb-1 text-right">
            You
          </div>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              {/* User answers occasionally include code or bullets too — render markdown
                  here for consistency. If users paste plain text it renders identically. */}
              <Markdown content={content} />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  if (type === "feedback" && feedback) {
    return (
      <motion.div
        // Slightly larger entrance for feedback because it's the highest-information
        // bubble and tends to land after a wait — bigger landing = bigger payoff.
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="flex justify-start"
      >
        <div className="max-w-full w-full">
          <div className="text-xs text-muted-foreground mb-1">Feedback</div>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 space-y-4">
              {/* Score + radial. Replaces the previous flat "8 out of 10" chip — the radial
                  tracks fill % so a glance tells the user how close to the ceiling they got. */}
              <div className="flex items-center gap-3">
                <ScoreRadial score={feedback.score} size={56} />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>out of 10</span>
                  {/* Help affordance — click to open the grading rubric explanation. */}
                  <RubricInfo />
                </div>
              </div>

              <Markdown content={content} />

              {feedback.strengths.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium text-foreground">
                      Strengths
                    </span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {feedback.strengths.map((strength, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-muted-foreground list-disc"
                      >
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs font-medium text-foreground">
                      Areas to Improve
                    </span>
                  </div>
                  <ul className="space-y-1 pl-6">
                    {feedback.improvements.map((improvement, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-muted-foreground list-disc"
                      >
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Re-answer affordance. Hidden when the parent doesn't pass onRetry
                  — e.g. read-only past-session views. */}
              {onRetry && (
                <div className="pt-2 border-t border-border/50 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onRetry}
                    className="h-7 text-xs gap-1.5"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Try this question again
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  return null;
}
