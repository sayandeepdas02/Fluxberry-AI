import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/* ═══════════════════════════════════════════════════
   EMPTY STATE — Placeholder for pages with no data
   ═══════════════════════════════════════════════════ */

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actions?: EmptyStateAction[];
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  actions,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-8 py-16 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      <h3 className="heading-sm mb-1">{title}</h3>

      {description && (
        <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>
      )}

      {/* Legacy single action */}
      {actionLabel && onAction && !actions && (
        <button
          onClick={onAction}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}

      {/* Rich multi-action CTA */}
      {actions && actions.length > 0 && (
        <div className="mt-6 flex items-center gap-3">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={action.onClick}
              className={cn(
                "rounded-lg px-4 py-2 text-[13px] font-medium transition-all cursor-pointer",
                action.variant === 'secondary'
                  ? "bg-card border border-line text-foreground hover:bg-muted"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
