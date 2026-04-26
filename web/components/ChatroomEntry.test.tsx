/**
 * ChatroomEntry — unit tests for the chatroom-list card in the interview sidebar.
 *
 * Tests pin down:
 *   - Title + resume filename + relative date all render in the card
 *   - Active entry shows the active-state indicator (the small primary dot)
 *   - When `onSelect` is provided, clicking calls it with the entry's id
 *   - Without `onSelect`, the card is non-interactive (no role="button")
 *
 * We don't snapshot the Tailwind classes — those are an implementation detail and
 * change frequently. We assert on user-visible content + a11y roles instead.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { ChatroomEntry } from "./ChatroomEntry";

describe("ChatroomEntry", () => {
  it("renders title, resume filename, and a relative date", () => {
    // 5 minutes ago — picked to exercise the "minute" branch of formatRelative.
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    render(
      <ChatroomEntry
        id="x"
        title="Mid Mixed Interview"
        resumeFileName="alice-resume.pdf"
        createdAt={fiveMinutesAgo}
        isActive={false}
      />,
    );
    expect(screen.getByText("Mid Mixed Interview")).toBeInTheDocument();
    expect(screen.getByText("alice-resume.pdf")).toBeInTheDocument();
    expect(screen.getByText(/minutes ago/)).toBeInTheDocument();
  });

  it("shows an active-session indicator when isActive is true", () => {
    render(
      <ChatroomEntry
        id="x"
        title="Live"
        resumeFileName={null}
        createdAt={new Date().toISOString()}
        isActive={true}
      />,
    );
    // The active dot has aria-label="Active session" so it's announced to assistive tech.
    expect(screen.getByLabelText("Active session")).toBeInTheDocument();
  });

  it("calls onSelect with the id when clicked (interactive mode)", () => {
    const onSelect = jest.fn();
    render(
      <ChatroomEntry
        id="abc-123"
        title="Past"
        resumeFileName="r.pdf"
        createdAt={new Date(Date.now() - 60_000 * 60).toISOString()}
        isActive={false}
        onSelect={onSelect}
      />,
    );
    // role="button" is set when onSelect is provided.
    const card = screen.getByRole("button");
    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith("abc-123");
  });

  it("renders as non-interactive when onSelect is omitted", () => {
    render(
      <ChatroomEntry
        id="x"
        title="Static"
        resumeFileName={null}
        createdAt={new Date().toISOString()}
        isActive={false}
      />,
    );
    // No role="button" → no clickable affordance.
    expect(screen.queryByRole("button")).toBeNull();
  });
});
