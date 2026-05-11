"use client";

import { useEffect, useRef, useState } from "react";

const CAL_LINK = "dsayandeep/fluxberry-ai-intro-call-with-sayandeep";
const EMBED_ID = "fluxberry-cal-inline";

/* ─────────────────────────────────────────────────
   Extend Window with the Cal.com global
   ───────────────────────────────────────────────── */
declare global {
  interface Window {
    Cal?: ((...args: unknown[]) => void) & {
      loaded?: boolean;
      q?: unknown[][];
      ns?: Record<string, unknown>;
    };
  }
}

export function CalEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    /* ── Cal.com queue bootstrap (official pattern, typed) ── */
    if (!window.Cal) {
      const queue: unknown[][] = [];
      const Cal = ((...args: unknown[]) => {
        queue.push(args);
      }) as Window["Cal"];
      Cal!.q = queue;
      Cal!.ns = {};
      window.Cal = Cal;
    }

    /* ── Lazy-load the embed script ── */
    const script = document.createElement("script");
    script.src = "https://app.cal.com/embed/embed.js";
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.head.appendChild(script);

    /* ── Queue commands (executed by embed.js once it loads) ── */
    // Assign to a local const so TypeScript can see it is non-null
    const cal = window.Cal!;

    cal("init", { origin: "https://cal.com" });

    cal("inline", {
      elementOrSelector: `#${EMBED_ID}`,
      config: { layout: "month_view" },
      calLink: CAL_LINK,
    });

    cal("ui", {
      hideEventTypeDetails: false,
      layout: "month_view",
    });
  }, []);

  return (
    <div className="relative w-full flex flex-col">
      {/* ── Loading skeleton ── */}
      {!isLoaded && (
        <div
          className="absolute inset-0 flex flex-col gap-3 p-6 animate-pulse pointer-events-none z-10"
          aria-hidden="true"
        >
          <div className="h-5 w-1/3 bg-muted rounded-sm" />
          <div className="h-4 w-2/3 bg-muted/60 rounded-sm mt-1" />
          <div className="mt-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-8 bg-muted/40 rounded-sm" />
            ))}
          </div>
          <div className="mt-4 flex gap-3">
            <div className="h-10 flex-1 bg-muted/60 rounded-sm" />
            <div className="h-10 flex-1 bg-muted/60 rounded-sm" />
          </div>
        </div>
      )}

      {/* ── Cal.com mounts its iframe inside this div ── */}
      <div
        id={EMBED_ID}
        ref={containerRef}
        style={{ minHeight: "640px", width: "100%" }}
        className={
          isLoaded
            ? "opacity-100 transition-opacity duration-500 ease-in"
            : "opacity-0"
        }
      />
    </div>
  );
}
