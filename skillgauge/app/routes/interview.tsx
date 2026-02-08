/**
 * Interview Page Route
 * Main interview interface with AI conversation
 * Protected route - requires authentication and active session
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { InterviewLayout } from "~/layouts/InterviewLayout";
import { InterviewSidebar } from "~/features/interview/InterviewSidebar";
import { InterviewHeader } from "~/features/interview/InterviewHeader";
import { MessageBubble } from "~/features/interview/MessageBubble";
import { AnswerInput } from "~/features/interview/AnswerInput";
import { TypingIndicator } from "~/features/interview/TypingIndicator";
import { useSession } from "~/hooks/useSession";
import { useAuth } from "~/hooks/useAuth";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function InterviewPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  const {
    session,
    messages,
    isLoading,
    isComplete,
    initializeSession,
    submitUserAnswer,
  } = useSession();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Initialize session from stored data
  useEffect(() => {
    if (!initialized && isAuthenticated) {
      const storedSession = sessionStorage.getItem("current_session");
      const jobDescription = sessionStorage.getItem("job_description");

      // Redirect to setup if no session data
      if (!storedSession || !jobDescription) {
        navigate("/setup");
        return;
      }

      // Initialize the interview session
      initializeSession({
        resumeFileName: "resume.pdf",
        resumeContent: "Mock content",
        jobDescription,
      });

      setInitialized(true);
    }
  }, [initialized, isAuthenticated, navigate, initializeSession]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Show loading state
  if (authLoading || !session) {
    return (
      <InterviewLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      </InterviewLayout>
    );
  }

  // Handle starting a new session
  const handleStartNewSession = () => {
    sessionStorage.removeItem("current_session");
    sessionStorage.removeItem("job_description");
    navigate("/setup");
  };

  return (
    <InterviewLayout
      sidebar={<InterviewSidebar sessionTitle={session.title} />}
      header={
        <InterviewHeader
          title={session.title}
          currentQuestion={session.currentQuestionIndex}
          totalQuestions={session.totalQuestions}
        />
      }
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Messages area - scrollable */}
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

            {/* Show typing indicator while AI is processing */}
            {isLoading && <TypingIndicator />}

            {/* Completion message */}
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

        {/* Answer input */}
        <AnswerInput
          onSubmit={submitUserAnswer}
          isLoading={isLoading}
          isDisabled={isComplete}
        />
      </div>
    </InterviewLayout>
  );
}
