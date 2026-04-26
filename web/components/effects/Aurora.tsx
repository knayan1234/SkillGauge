/**
 * Aurora — three soft drifting orbs that compose a subtle ambient backdrop.
 *
 * Inspired by reactbits.dev's Aurora primitive but implemented with pure CSS (no
 * canvas, no WebGL, no JS animation loop) so it ships zero runtime cost and works in
 * Server Components. The orbs use theme tokens (`primary`, `accent-2`, `accent`) so
 * the layer adapts to dark/light without a re-render.
 *
 * Usage: drop inside any container as the bottom layer. The component sets `inset-0`
 * + `pointer-events-none` so it never interferes with interactions.
 *
 *   <section className="relative">
 *     <Aurora />
 *     <div className="relative"> ... your content ... </div>
 *   </section>
 *
 * `aria-hidden` is on the wrapper since this is purely decorative.
 */

interface AuroraProps {
  /**
   * Anchor mode. `fixed` keeps the layer pinned to the viewport (good for landing
   * pages that scroll). `absolute` confines the layer to its parent.
   */
  position?: "fixed" | "absolute";
  /** Optional class for additional Tailwind tweaks at the call site. */
  className?: string;
}

export function Aurora({ position = "fixed", className = "" }: AuroraProps) {
  const positionClass =
    position === "fixed" ? "fixed inset-0" : "absolute inset-0";
  return (
    <div
      aria-hidden="true"
      className={`${positionClass} -z-10 overflow-hidden pointer-events-none ${className}`}
    >
      <div className="aurora-orb aurora-orb-a" />
      <div className="aurora-orb aurora-orb-b" />
      <div className="aurora-orb aurora-orb-c" />
    </div>
  );
}
