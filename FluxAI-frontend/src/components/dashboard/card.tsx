import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   DASHBOARD CARD — Styled card with new dark palette
   ═══════════════════════════════════════════════════ */

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function DashboardCard({
  children,
  className,
  padding = "md",
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
