/**
 * Skeleton — neutral, pulsing placeholder block.
 *
 * Use this in place of a spinner whenever the layout is known but the data isn't ready
 * yet. Spinners are honest about "we're working" but tell the user nothing about what's
 * coming; skeletons preview the shape so the eye doesn't flinch when content lands.
 *
 * The pulse is pure Tailwind (`animate-pulse`) — no JS animation, no Framer overhead.
 * Match the height/width of the real content via className from the call site so the
 * skeleton occupies the same box.
 */

import { cn } from "@/lib/utils";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        // `shimmer` is a moving sheen overlay (left-to-right gradient sweep). Reads as
        // more polished than opacity-pulse and matches the brand-frame sweep direction.
        "shimmer rounded-md",
        className,
      )}
      // Decorative — accessible loading state should live on the parent region.
      aria-hidden="true"
      {...props}
    />
  );
}
