import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════
   SKELETON LOADER SYSTEM — Reusable skeleton components
   Uses CSS shimmer animation from globals.css
   ═══════════════════════════════════════════════════ */

interface SkeletonProps {
  className?: string;
}

/** Base skeleton block with shimmer animation */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      aria-hidden="true"
    />
  );
}

/** Skeleton for text lines */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full" // last line shorter
          )}
        />
      ))}
    </div>
  );
}

/** Skeleton for avatar/circle */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return <Skeleton className={cn("rounded-full", sizeMap[size])} />;
}

/** Skeleton for a card */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 space-y-4", className)} aria-hidden="true">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size="sm" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

/** Skeleton for a table row */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border" aria-hidden="true">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === 0 ? "w-32" : "flex-1"
          )}
        />
      ))}
    </div>
  );
}

/** Skeleton for a list of table rows */
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i === 0 ? "w-24" : "flex-1")} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

/** Skeleton for the sidebar */
export function SkeletonSidebar() {
  return (
    <div className="w-[260px] h-screen border-r border-border bg-sidebar p-3 space-y-4" aria-hidden="true">
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2.5 w-16" />
        </div>
      </div>
      <div className="space-y-1.5 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
      <Skeleton className="h-3 w-16 mt-4" />
      <div className="space-y-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the dashboard page */
export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}
