"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

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
  const speech = useSpeechRecognition();

  // While the mic is on, the live transcript is the textarea's source of truth;
  // when the mic is off, the user's typed `answer` is. Computing this as derived
  // state — instead of mirroring transcript → answer via an effect — avoids the
  // cascading-render trap and keeps the data flow one-way.
  const displayValue = speech.isListening ? speech.transcript : answer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalAnswer = (
      speech.isListening ? speech.transcript : answer
    ).trim();
    if (!finalAnswer || isLoading || isDisabled) {
      return;
    }

    // Stop any active dictation before submitting — otherwise the recogniser
    // keeps running after the answer panel clears.
    if (speech.isListening) speech.stop();
    speech.reset();
    onSubmit(finalAnswer);
    setAnswer("");
  };

  const toggleDictation = () => {
    if (speech.isListening) {
      // Stopping: snapshot the transcript into `answer` so the user can edit it
      // freely without the recogniser overwriting their changes.
      const final = speech.transcript;
      speech.stop();
      if (final) setAnswer(final);
    } else {
      // Starting fresh — clear previous transcript + typed answer so each
      // dictation session writes into an empty buffer instead of compounding.
      speech.reset();
      setAnswer("");
      speech.start();
    }
  };

  return (
    <div className="border-t border-border bg-background/50 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative">
          <Textarea
            value={displayValue}
            onChange={(e) => {
              // Editing during dictation isn't supported — the live transcript is
              // canonical until the mic stops. Drop edits silently while listening.
              if (!speech.isListening) setAnswer(e.target.value);
            }}
            readOnly={speech.isListening}
            placeholder={
              isDisabled
                ? "Interview complete ✓"
                : speech.isListening
                  ? "Listening… speak your answer"
                  : "Type your answer here..."
            }
            disabled={isLoading || isDisabled}
            rows={3}
            className="pr-32 resize-none border-border/50 bg-background/80 focus:bg-background transition-colors"
            aria-label="Your answer"
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
            {/* Mic button: hidden in browsers without SpeechRecognition support
                (Firefox today). The user can always type — voice is augmentation. */}
            {speech.isSupported && (
              <Button
                type="button"
                onClick={toggleDictation}
                disabled={isLoading || isDisabled}
                size="sm"
                variant={speech.isListening ? "default" : "outline"}
                className="h-8 px-2"
                aria-label={
                  speech.isListening ? "Stop dictation" : "Dictate answer"
                }
                title={
                  speech.isListening ? "Stop dictation" : "Dictate answer"
                }
              >
                {speech.isListening ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </Button>
            )}
            <Button
              type="submit"
              disabled={!displayValue.trim() || isLoading || isDisabled}
              size="sm"
              className="h-8 px-3 bg-primary hover:bg-primary/90 shadow-sm"
              aria-label="Submit answer"
              title="Submit answer"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
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
          {speech.isSupported && (
            <span className="ml-2 opacity-70">· tap the mic to dictate</span>
          )}
        </p>
      </form>
    </div>
  );
}
