/**
 * InterviewHeader Component
 * Header showing interview progress
 */
interface InterviewHeaderProps {
  title: string;
  currentQuestion: number;
  totalQuestions: number;
}

/**
 * Header displaying session progress
 * Shows current question number and total questions
 */
export function InterviewHeader({
  title,
  currentQuestion,
  totalQuestions,
}: InterviewHeaderProps) {
  return (
    <div className="h-full flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>
      <div className="text-xs text-muted-foreground">
        Question {currentQuestion + 1} of {totalQuestions}
      </div>
    </div>
  );
}
