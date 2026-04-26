/**
 * formatRelative — pins down the user-facing date formatting logic for the chatroom
 * sidebar. We pass an explicit `now` so tests are deterministic regardless of the
 * machine clock.
 *
 * `Intl.RelativeTimeFormat` with `numeric: "auto"` produces locale-friendly strings —
 * "yesterday" instead of "1 day ago", "now" for sub-minute deltas. We pin the en-US
 * output because that's what the Jest runtime uses by default; if a future locale
 * change is desired we'd need to widen the assertions.
 */

import { formatRelative } from "./relativeTime";

const NOW = new Date("2026-04-25T12:00:00.000Z");

describe("formatRelative", () => {
  it("returns 'now' for sub-minute deltas (under 60s old)", () => {
    const justNow = new Date(NOW.getTime() - 30 * 1000).toISOString();
    expect(formatRelative(justNow, NOW)).toBe("now");
  });

  it("formats 5 minutes ago", () => {
    const t = new Date(NOW.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatRelative(t, NOW)).toMatch(/5 minutes ago/);
  });

  it("formats yesterday using locale-aware language (numeric: auto)", () => {
    const t = new Date(NOW.getTime() - 24 * 60 * 60 * 1000).toISOString();
    // Intl with numeric: "auto" → "yesterday" in en-US, not "1 day ago".
    expect(formatRelative(t, NOW)).toBe("yesterday");
  });

  it("formats 3 weeks ago", () => {
    const t = new Date(NOW.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatRelative(t, NOW)).toMatch(/3 weeks ago/);
  });

  it("clamps a future timestamp to 'now' (defends against clock-skew)", () => {
    const future = new Date(NOW.getTime() + 60 * 60 * 1000).toISOString();
    expect(formatRelative(future, NOW)).toBe("now");
  });

  it("returns 'unknown' for a malformed string instead of crashing", () => {
    expect(formatRelative("not-a-date", NOW)).toBe("unknown");
  });
});
