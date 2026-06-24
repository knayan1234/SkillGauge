/**
 * LlmBadge — FE LLM-provider indicator.
 *
 * Tests pin down:
 *   - Initial render shows nothing (loading state — avoid flicker)
 *   - After resolve with `{llmProvider: "stub", llmModel: null}`, shows "stub" label +
 *     the stub-specific tooltip via the title attribute
 *   - When `llmModel` is non-null (a real provider is configured), label appends
 *     "· <model>"
 *
 * `fetchHealthInfo` is mocked because we're asserting UI behavior, not the network call.
 */

import { render, screen, waitFor } from "@testing-library/react";
import { QueryWrapper } from "@/test/queryWrapper";

const mockFetchHealthInfo = jest.fn();
jest.mock("@/services/api", () => {
  const actual = jest.requireActual("@/services/api") as Record<string, unknown>;
  return {
    ...actual,
    fetchHealthInfo: () => mockFetchHealthInfo(),
  };
});

import { LlmBadge } from "./LlmBadge";

beforeEach(() => {
  mockFetchHealthInfo.mockReset();
});

describe("LlmBadge", () => {
  it("renders nothing while the health-info request is in flight", () => {
    // Never resolve — keeps the query in loading state for the test.
    mockFetchHealthInfo.mockImplementation(
      () => new Promise(() => undefined),
    );
    const { container } = render(<LlmBadge />, { wrapper: QueryWrapper });
    expect(container).toBeEmptyDOMElement();
  });

  it("shows 'stub' label and stub tooltip when llmProvider is 'stub'", async () => {
    mockFetchHealthInfo.mockResolvedValue({
      llmProvider: "stub",
      llmModel: null,
    });
    render(<LlmBadge />, { wrapper: QueryWrapper });

    // The visible label is "stub" — no model suffix when llmModel is null.
    const badge = await screen.findByText("stub");
    expect(badge).toBeInTheDocument();

    // Tooltip + aria-label live on the badge button (the label text is a span inside it,
    // hidden on mobile). Hover-style title is the simplest a11y-friendly tooltip.
    const button = badge.closest("button");
    expect(button?.getAttribute("title")).toMatch(/stub provider/i);
    expect(button?.getAttribute("aria-label")).toMatch(/active llm provider/i);
  });

  it("appends '· <model>' to the label when llmModel is populated", async () => {
    // This is the shape /api/health/info returns once a real provider is configured.
    // Pinning it so the badge works the moment an API key is dropped into env.
    mockFetchHealthInfo.mockResolvedValue({
      llmProvider: "openai",
      llmModel: "gpt-4o-mini",
    });
    render(<LlmBadge />, { wrapper: QueryWrapper });
    await waitFor(() =>
      expect(screen.getByText("openai · gpt-4o-mini")).toBeInTheDocument(),
    );
  });
});
