"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

/* ─────────────────────────────────────────────────
   FINAL CTA SECTION — Chanhdai-style Editorial
   Flat dark, sharp buttons, no gradient/glow
   ───────────────────────────────────────────────── */
export function FinalCTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="cta"
      className="section-enter relative w-full overflow-hidden screen-line-top"
      style={{
        paddingTop: "clamp(64px, 8vw, var(--space-24))",
        paddingBottom: "clamp(64px, 8vw, var(--space-24))",
        backgroundColor: "#0f172a",
      }}
    >
      {/* ── Content Container ── */}
      <div
        className="mx-auto relative z-10 flex flex-col items-center text-center"
        style={{
          paddingInline: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        <h2
          className="font-semibold tracking-tight text-white text-balance"
          style={{
            fontSize: "clamp(1.75rem, 4vw, 44px)",
            lineHeight: "1.12",
            letterSpacing: "-0.02em",
            maxWidth: "720px",
          }}
        >
          Let AI run your hiring{" "}
          <span style={{ color: "#8b93e0" }}>— while you focus on building your team</span>
        </h2>

        <p
          className="font-normal"
          style={{
            color: "rgba(255, 255, 255, 0.6)",
            fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
            lineHeight: "1.6",
            maxWidth: "600px",
            marginTop: "var(--space-4)",
          }}
        >
          Join modern teams using Fluxberry AI to hire faster and smarter.
        </p>

        {/* ── CTA Buttons — sharp rectangles ── */}
        <div
          className="flex flex-wrap items-center justify-center"
          style={{
            gap: "var(--space-3)",
            marginTop: "var(--space-10)",
          }}
        >
          {/* Primary CTA */}
          <Link href="/signup">
            <button
              className={cn(
                "cursor-pointer font-medium text-white",
                "flex items-center",
                "hover:opacity-90",
                "transition-all duration-200 ease-out"
              )}
              style={{
                padding: "10px 28px",
                fontSize: "15px",
                backgroundColor: "var(--primary)",
                gap: "var(--space-2)",
              }}
            >
              Start free trial
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>

          {/* Secondary CTA */}
          <Link href="/demo">
            <button
              className={cn(
                "cursor-pointer font-medium",
                "border border-white/20 bg-white/5 text-white",
                "flex items-center",
                "hover:bg-white/10 hover:border-white/30",
                "active:bg-white/5",
                "transition-all duration-200 ease-out"
              )}
              style={{
                padding: "10px 24px",
                fontSize: "15px",
                gap: "var(--space-2)",
              }}
            >
              Book a demo
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
