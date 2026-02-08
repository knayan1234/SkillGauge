import { Brain, MessageSquare, Clock } from "lucide-react";
import { Card } from "~/components/ui/card";

interface InterviewSidebarProps {
  sessionTitle: string;
}

export function InterviewSidebar({ sessionTitle }: InterviewSidebarProps) {
  // Placeholder chat histories - replace with actual data from backend
  const chatHistories = [
    {
      id: 1,
      title: "Frontend Developer Interview",
      date: "Today",
      active: true,
    },
    {
      id: 2,
      title: "React Engineer Practice",
      date: "Yesterday",
      active: false,
    },
    { id: 3, title: "Full Stack Position", date: "2 days ago", active: false },
  ];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">SkillGauge</h2>
        </div>
      </div>

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
    </div>
  );
}
