/**
 * SkillGaugeLogo — custom SVG mark for the SkillGauge brand.
 *
 * The mark is a stylised gauge: a half-circle arc broken into three segments
 * (light → medium → strong tint of `currentColor`), with a tapered needle pointing
 * up-right past the rightmost segment. Reads as "measurement progressing toward a
 * target" — matches the product's name (`SkillGauge`) and its core idea (interview
 * skills tracked across rounds).
 *
 * Design choices:
 *   - Pure SVG, sized via `width` / `height` props. `currentColor` lets a parent set
 *     the hue with Tailwind's `text-primary` etc., so the mark inherits theme tokens
 *     without per-call props.
 *   - Stroke-rounded caps + 2.6 stroke-width keep the mark crisp at small sizes
 *     (16px header) and still readable at large (40px+ hero).
 *   - The needle has its own opacity so it reads as "the active value" against the
 *     gauge arc, which is dimmer.
 *   - `aria-hidden` by default — the parent label is the accessible name. Pass
 *     `title` if used standalone.
 */

interface SkillGaugeLogoProps {
  /** Width + height in pixels. Defaults to 24 (matches Lucide default). */
  size?: number;
  /** Optional Tailwind/CSS class for color (`text-primary` etc.) and layout. */
  className?: string;
  /** Pass an accessible label only when this is the sole label for the parent button. */
  title?: string;
}

export function SkillGaugeLogo({
  size = 24,
  className = "",
  title,
}: SkillGaugeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}
      {/* Outer arc — full half-circle from 8 o'clock to 4 o'clock, dim. */}
      <path d="M3.5 16a9 9 0 0 1 17 0" opacity="0.4" />
      {/* Mid arc — slightly inset, medium opacity. */}
      <path d="M5.5 16a7 7 0 0 1 13 0" opacity="0.65" />
      {/* Inner arc — innermost band, full opacity. */}
      <path d="M7.5 16a5 5 0 0 1 9 0" opacity="0.9" />
      {/* Pivot — small filled circle at the gauge's centre. Stays static while the
          needle sweeps around it. */}
      <circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none" />
      {/* Needle — wrapped in a `<g class="gauge-needle">` so the CSS animation
          rotates only the needle, not the arcs. The needle is drawn at its "neutral"
          straight-up position; CSS rotate sweeps it left/right around (12, 16). */}
      <g className="gauge-needle">
        <line x1="12" y1="16" x2="12" y2="8.5" strokeWidth="2.4" />
      </g>
    </svg>
  );
}
