import { render, screen } from "@testing-library/react";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders a question variant with 'Interviewer' label", () => {
    render(
      <MessageBubble type="question" content="Tell me about yourself." />,
    );
    expect(screen.getByText("Interviewer")).toBeInTheDocument();
    expect(screen.getByText("Tell me about yourself.")).toBeInTheDocument();
  });

  it("renders an answer variant with 'You' label", () => {
    render(<MessageBubble type="answer" content="I am a developer." />);
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("I am a developer.")).toBeInTheDocument();
  });

  it("renders a feedback variant with score, strengths and improvements", () => {
    render(
      <MessageBubble
        type="feedback"
        content="Great answer!"
        feedback={{
          score: 8,
          strengths: ["clear", "structured"],
          improvements: ["add metrics"],
        }}
      />,
    );
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("out of 10")).toBeInTheDocument();
    expect(screen.getByText("Strengths")).toBeInTheDocument();
    expect(screen.getByText("clear")).toBeInTheDocument();
    expect(screen.getByText("structured")).toBeInTheDocument();
    expect(screen.getByText("Areas to Improve")).toBeInTheDocument();
    expect(screen.getByText("add metrics")).toBeInTheDocument();
  });

  it("returns null for feedback type without feedback data", () => {
    const { container } = render(
      <MessageBubble type="feedback" content="no data" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
