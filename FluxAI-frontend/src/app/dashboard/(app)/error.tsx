"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/* ═══════════════════════════════════════════════════
   ERROR BOUNDARY — Dashboard-level error handler
   Production safety with retry support
   ═══════════════════════════════════════════════════ */

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service in production
    console.error("[Dashboard Error]", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>

        <h2 className="heading-md mb-2">Something went wrong</h2>

        <p className="mb-6 text-[13px] text-muted-foreground">
          An unexpected error occurred while loading this page. This has been
          logged and our team has been notified.
        </p>

        {error.digest && (
          <p className="mb-4 rounded-md bg-muted/50 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
