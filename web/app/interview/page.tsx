"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { InterviewLayout } from "@/components/InterviewLayout";
import { InterviewSidebar } from "@/features/interview/InterviewSidebar";
import { InterviewHeader } from "@/features/interview/InterviewHeader";
import { MessageBubble } from "@/features/interview/MessageBubble";
import { AnswerInput } from "@/features/interview/AnswerInput";
import { TypingIndicator } from "@/features/interview/TypingIndicator";
import { useSession } from "@/hooks/useSession";
import { useAuth } from "@/hooks/useAuth";
import { STORAGE_KEYS } from "@/lib/storageKeys";
import type { SessionOptions } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function InterviewPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  const {
    session,
    messages,
    isLoading,
    isComplete,
    initializeSession,
    submitUserAnswer,
  } = useSession();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!initialized && isAuthenticated) {
      const resumePayload = sessionStorage.getItem(STORAGE_KEYS.session.id);
      const jobDescription = sessionStorage.getItem(
        STORAGE_KEYS.session.jobDescription,
      );
      const optionsRaw = sessionStorage.getItem(STORAGE_KEYS.session.options);

      if (!resumePayload || !jobDescription || !optionsRaw) {
        router.push("/setup");
        return;
      }

      // Setup form wrote { resumeFileName, resumeContent } as JSON so the interview page
      // can POST /api/sessions with the real resume bytes. Bad JSON = setup-form bug,
      // safer to bounce back than render a broken interview.
      let parsed: { resumeFileName: string; resumeContent: string };
      let options: SessionOptions;
      try {
        parsed = JSON.parse(resumePayload);
        options = JSON.parse(optionsRaw) as SessionOptions;
      } catch {
        router.push("/setup");
        return;
      }

      setResumeFileName(parsed.resumeFileName);
      initializeSession({
        resumeFileName: parsed.resumeFileName,
        resumeContent: parsed.resumeContent,
        jobDescription,
        ...options,
      });

      setInitialized(true);
    }
  }, [initialized, isAuthenticated, router, initializeSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear the "in progress" marker once the backend says we're done — lets setup
  // skip the archive-confirm modal on the next run.
  useEffect(() => {
    if (isComplete) {
      sessionStorage.removeItem(STORAGE_KEYS.session.active);
    }
  }, [isComplete]);

  if (authLoading || !session) {
    return (
      <InterviewLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </InterviewLayout>
    );
  }

  const handleStartNewSession = () => {
    sessionStorage.removeItem(STORAGE_KEYS.session.id);
    sessionStorage.removeItem(STORAGE_KEYS.session.jobDescription);
    sessionStorage.removeItem(STORAGE_KEYS.session.options);
    sessionStorage.removeItem(STORAGE_KEYS.session.active);
    router.push("/setup");
  };

  return (
    <InterviewLayout
      sidebar={
        <InterviewSidebar
          sessionTitle={session.title}
          resumeFileName={resumeFileName}
          isActive={!isComplete}
        />
      }
      header={
        <InterviewHeader
          title={session.title}
          currentQuestion={session.currentQuestionIndex}
          totalQuestions={session.totalQuestions}
          isActive={!isComplete}
        />
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
          <div className="max-w-3xl mx-auto space-y-6 pb-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                type={message.type as "question" | "answer" | "feedback"}
                content={message.content}
                feedback={message.feedback}
              />
            ))}

            {isLoading && <TypingIndicator />}

            {isComplete && (
              <Card className="animate-slide-up mt-8 border-primary/20 bg-card">
                <CardContent className="p-6 text-center">
                  <div className="h-10 w-10 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-primary/80" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Interview Complete
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Great job completing your practice session! Review the
                    feedback above to improve.
                  </p>
                  <Button
                    onClick={handleStartNewSession}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Start New Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <AnswerInput
          onSubmit={submitUserAnswer}
          isLoading={isLoading}
          isDisabled={isComplete}
        />
      </div>
    </InterviewLayout>
  );
}
