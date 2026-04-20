import { CheckCircle, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MessageBubbleProps {
  type: "question" | "answer" | "feedback";
  content: string;
  feedback?: {
    score: number;
    strengths: string[];
    improvements: string[];
  };
}

export function MessageBubble({ type, content, feedback }: MessageBubbleProps) {
  if (type === "question") {
    return (
      <div className="flex justify-start animate-fade-in">
        <div className="max-w-[80%]">
          <div className="text-xs text-muted-foreground mb-1">Interviewer</div>
          <Card className="bg-card/80 border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {content}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (type === "answer") {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="max-w-[80%]">
          <div className="text-xs text-muted-foreground mb-1 text-right">
            You
          </div>
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <p className="text-sm text-foreground leading-relaxed">
                {content}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (type === "feedback" && feedback) {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="max-w-full w-full">
          <div className="text-xs text-muted-foreground mb-1">Feedback</div>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {feedback.score}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">out of 10</span>
              </div>

              <p className="text-sm text-foreground leading-relaxed">
                {content}
              </p>

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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
