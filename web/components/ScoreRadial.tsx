/**
 * ScoreRadial — animated radial gauge for a single 0–10 graded answer.
 *
 * Why a radial (and not a flat number):
 *   - A flat "8" chip is accurate but emotionally flat. A radial gives the same
 *     information plus a glanceable "how close to 10" — useful when the user is
 *     scrolling many questions.
 *   - Animated fill-on-mount produces a subtle reward signal without being gamified.
 *
 * Sizing:
 *   - The default `size: 64` matches the previous chip + label height in the feedback
 *     bubble, so swapping it in is layout-neutral.
 *   - Larger sizes (e.g., 120) work well on the completion screen — pass `size={120}`.
 *
 * Color thresholds:
 *   - 0–4  : red   (needs work)
 *   - 5–7  : amber (decent)
 *   - 8–10 : green (strong)
 *   These are deliberate three-tier buckets, not a continuous gradient — easier to
 *   read at a glance and matches typical rubric language.
 */

"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";

interface ScoreRadialProps {
  score: number; // 0–10
  size?: number;
  showLabel?: boolean;
}

function colorForScore(score: number): string {
  // Tailwind palette tokens kept inline because recharts `fill` wants a literal color.
  // hsl values match: red-500, amber-500, emerald-500.
  if (score <= 4) return "hsl(0 84% 60%)";
  if (score <= 7) return "hsl(38 92% 50%)";
  return "hsl(160 84% 39%)";
}

export function ScoreRadial({ score, size = 64, showLabel = true }: ScoreRadialProps) {
  // Clamp defensively — LLM responses are validated upstream by gradeResponseSchema, but
  // a stale cached payload from before the schema landed could still slip through.
  const clamped = Math.max(0, Math.min(10, score));
  const color = colorForScore(clamped);

  // recharts wants a single-row dataset where `value` becomes the bar length and the
  // domain (0–10 here) is set on PolarAngleAxis. The empty `name` field keeps the
  // legend out of the visual since we only want the arc + center number.
  const data = [{ name: "score", value: clamped, fill: color }];

  // "You nailed it" signal — scores ≥ 8 get a thin amber halo around the radial.
  // Reads as an achievement marker without changing the radial's own colour logic;
  // the bar stays green (per the threshold), the ring outside is amber.
  const isHighScore = clamped >= 8;

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full ${
        isHighScore
          ? "ring-2 ring-amber-500/60 ring-offset-2 ring-offset-background"
          : ""
      }`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score: ${clamped} out of 10${
        isHighScore ? " — high score" : ""
      }`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          // innerRadius / outerRadius use percent strings so the arc scales with `size`.
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 10]} tick={false} />
          <RadialBar
            background={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            dataKey="value"
            cornerRadius={size / 2}
            // Animated fill on mount — recharts handles the tween. Subtle but present.
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-semibold text-foreground"
            style={{ fontSize: Math.max(12, size * 0.32) }}
          >
            {clamped}
          </span>
        </div>
      )}
    </div>
  );
}
