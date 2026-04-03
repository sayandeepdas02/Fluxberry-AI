"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";
import { FallingPattern } from "@/components/ui/falling-pattern";

/* ─────────────────────────────────────────────────
   HERO SECTION — Chanhdai-style Editorial
   Flat bg, sharp edges, border-driven depth
   ───────────────────────────────────────────────── */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    const elements = sectionRef.current?.querySelectorAll(".section-enter");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <SectionWrapper ref={sectionRef} id="hero" className="relative overflow-hidden py-[80px] md:py-[100px]">
      {/* ── Falling Pattern Background ── */}
      <div className="absolute inset-0 z-0">
        <FallingPattern className="h-full w-full [mask-image:radial-gradient(ellipse_at_center,transparent,var(--background))]" />
      </div>

      {/* ── Content Container ── */}
      <div className="mx-auto w-full relative z-10 flex flex-col items-center gap-12 md:gap-16">
        {/* ═══ TEXT CONTENT — Centered ═══ */}
        <div className="flex flex-col items-center text-center">
          {/* Headline */}
          <h1
            className="tracking-tight text-foreground text-balance"
            style={{
              fontSize: "clamp(2.25rem, 5vw, var(--text-hero))",
              lineHeight: "1.08",
              letterSpacing: "-0.02em",
              maxWidth: "720px",
            }}
          >
            <span style={{ color: "#5561c8" }}>AI Native</span>
            {" "}Hiring Automation for growing teams
          </h1>

          {/* Subtext */}
          <p
            className="text-muted-foreground font-normal"
            style={{
              fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
              lineHeight: "1.6",
              maxWidth: "600px",
              marginTop: "var(--space-4)",
            }}
          >
            Hire, scale, and automate effortlessly,
            with one powerful hiring platform.
          </p>

          {/* CTA Buttons — SHARP rectangular */}
          <div
            className="flex flex-wrap items-center justify-center"
            style={{
              gap: "var(--space-3)",
              marginTop: "var(--space-8)",
            }}
          >
            {/* Secondary: Book a Demo */}
            <Link href="/demo">
              <SharpButton variant="outline">
                Book a Demo
              </SharpButton>
            </Link>

            {/* Primary: Start free trial */}
            <Link href="/signup">
              <SharpButton variant="primary">
                Start free trial
                <ArrowRight className="w-4 h-4 ml-2" />
              </SharpButton>
            </Link>
          </div>
        </div>

        {/* ═══ DASHBOARD VISUAL ═══ */}
        <div
          className="section-enter relative mx-auto pb-[40px] md:pb-[60px]"
          style={{
            marginTop: "var(--space-8)",
            width: "100%",
            maxWidth: "1024px",
          }}
        >
          <img 
            src="/HeroDashboard.png" 
            alt="Fluxberry AI Dashboard" 
            className="w-full h-auto"
          />
        </div>
      </div>
    </SectionWrapper>
  );
}