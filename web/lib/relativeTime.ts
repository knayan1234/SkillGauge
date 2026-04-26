/**
 * Tiny helper that formats an ISO timestamp as a human-readable relative date.
 *
 * Uses the standard `Intl.RelativeTimeFormat` API so we get localized output without a
 * dependency. Picks the largest sensible unit: minutes → hours → days → weeks → months
 * → years. Anything in the future is clamped to "now" since we don't expect future-dated
 * archive entries (they'd be a clock-skew bug, not a feature).
 *
 * Examples (en-US):
 *   formatRelative(now)                    → "now"
 *   formatRelative(2 minutes ago)          → "2 minutes ago"
 *   formatRelative(yesterday)              → "1 day ago"
 *   formatRelative(3 weeks ago)            → "3 weeks ago"
 *
 * Edge cases:
 *   - Invalid date string → "unknown"
 *   - Future timestamp    → "now" (clamped)
 *
 * Why a custom util instead of date-fns / dayjs: zero dependencies, ~30 LOC, and the
 * grouping logic for the chatroom sidebar doesn't need anything more sophisticated.
 */

interface UnitThreshold {
  unit: Intl.RelativeTimeFormatUnit;
  ms: number;
}

// Ordered largest-first. We pick the first unit where the elapsed time crosses the
// threshold, so "13 hours ago" formats as "13 hours" (not "0 days").
const UNITS: UnitThreshold[] = [
  { unit: "year", ms: 365 * 24 * 60 * 60 * 1000 },
  { unit: "month", ms: 30 * 24 * 60 * 60 * 1000 },
  { unit: "week", ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: "day", ms: 24 * 60 * 60 * 1000 },
  { unit: "hour", ms: 60 * 60 * 1000 },
  { unit: "minute", ms: 60 * 1000 },
];

const formatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto", // produces "yesterday" / "tomorrow" instead of "1 day ago"
});

export function formatRelative(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "unknown";
  const elapsedMs = now.getTime() - t;
  if (elapsedMs <= 0) return "now"; // future or "just now"

  for (const { unit, ms } of UNITS) {
    if (elapsedMs >= ms) {
      // RelativeTimeFormat takes a NEGATIVE number for the past.
      const value = -Math.floor(elapsedMs / ms);
      return formatter.format(value, unit);
    }
  }
  return "now"; // less than a minute
}
