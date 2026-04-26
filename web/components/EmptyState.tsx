/**
 * EmptyState — a consistent zero-content panel.
 *
 * Used wherever a list / page has nothing to show but needs to feel intentional
 * rather than broken. Pattern: icon + title + (optional) description + (optional) CTA.
 *
 * Single component, single concern. Pages own their copy + icon — this just enforces
 * a consistent visual rhythm so the 404, the empty sidebar, and the no-token reset
 * page all read like they belong to the same product.
 */

import type { LucideIcon } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  // lucide icon component (not a rendered element) so we can size + tint it consistently.
  icon: LucideIcon;
  title: string;
  description?: string;
  // Slot for a CTA — usually <Button> from components/ui/button. Optional because some
  // empty states (e.g., "no archived sessions yet") don't have an action to recommend.
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-10",
        className,
      )}
    >
      <div className="mb-4 h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
