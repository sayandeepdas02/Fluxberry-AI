"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

/* ─────────────────────────────────────────────────
   METRICS SECTION — Chanhdai-style Editorial
   Flat divider-based stat blocks, no cards
   ───────────────────────────────────────────────── */
export function MetricsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          entry.target.classList.add("visible");
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="metrics"
      className="section-enter relative w-full bg-background screen-line-top screen-line-bottom"
      style={{
        paddingTop: "clamp(64px, 8vw, var(--space-20))",
        paddingBottom: "clamp(64px, 8vw, var(--space-20))",
      }}
    >
      <div
        className="mx-auto"
        style={{
          paddingInline: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center justify-center text-center">
          <div
            className="inline-flex items-center font-medium"
            style={{
              padding: "4px 12px",
              gap: "6px",
              fontSize: "13px",
              color: "var(--primary)",
              background: "var(--primary-subtle)",
              border: "1px solid rgba(85, 97, 200, 0.15)",
              letterSpacing: "0.01em",
              marginBottom: "var(--space-4)",
            }}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Impact</span>
          </div>

          <h2
            className="font-semibold tracking-tight text-foreground text-balance"
            style={{
              fontSize: "clamp(1.75rem, 4vw, var(--text-display))",
              lineHeight: "1.12",
              maxWidth: "600px",
              letterSpacing: "-0.02em",
            }}
          >
            Built for speed.{" "}
            <span style={{ color: "var(--primary)" }}>Proven by results.</span>
          </h2>

          <p
            className="text-muted-foreground font-normal"
            style={{
              fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
              lineHeight: "1.6",
              maxWidth: "600px",
              marginTop: "var(--space-4)",
            }}
          >
            Teams using Fluxberry AI move faster, hire smarter, and scale effortlessly.
          </p>
        </div>

        {/* ═══ METRICS ROW — flat grid cells with shared borders ═══ */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 mx-auto border border-line"
          style={{
            marginTop: "clamp(48px, 6vw, var(--space-16))",
            maxWidth: "1024px",
          }}
        >
          <MetricItem
            value={85}
            suffix="%"
            label="Faster Hiring"
            description="Reduce time-to-hire dramatically with automation."
            isVisible={isVisible}
            delay={0}
          />
          <MetricItem
            value={10}
            suffix="x"
            label="Screening Speed"
            description="Process thousands of candidates instantly."
            isVisible={isVisible}
            delay={150}
            hasBorder
          />
          <MetricItem
            value={3}
            suffix="x"
            label="Recruiter Productivity"
            description="Focus on decisions, not manual data entry."
            isVisible={isVisible}
            delay={300}
            hasBorder
          />
        </div>
      </div>

      <style jsx global>{`
        .metric-enter {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 500ms ease-out, transform 500ms ease-out;
        }
        .metric-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   METRIC ITEM — sharp cell with border dividers
   ───────────────────────────────────────────────── */
function MetricItem({
  value,
  suffix,
  label,
  description,
  isVisible,
  delay,
  hasBorder,
}: {
  value: number;
  suffix: string;
  label: string;
  description: string;
  isVisible: boolean;
  delay: number;
  hasBorder?: boolean;
}) {
  const animatedValue = useCountUp(value, 2000, isVisible);

  return (
    <div
      className={cn(
        "metric-enter flex flex-col items-center md:items-start text-center md:text-left",
        isVisible && "visible",
        "py-8 md:py-8 md:px-8 lg:px-12",
        hasBorder ? "md:border-l border-line border-t md:border-t-0" : ""
      )}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="flex flex-col gap-3">
        <span
          className="font-semibold text-foreground"
          style={{ fontSize: "var(--text-body-sm)" }}
        >
          {label}
        </span>

        <div
          className="font-bold text-foreground tabular-nums tracking-tight"
          style={{
            fontSize: "clamp(40px, 5vw, 48px)",
            lineHeight: "1",
            color: "var(--foreground)",
          }}
        >
          {animatedValue}
          <span style={{ color: "var(--primary)" }}>{suffix}</span>
        </div>

        <p
          className="text-muted-foreground"
          style={{
            fontSize: "var(--text-body-sm)",
            lineHeight: "1.5",
            maxWidth: "280px",
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration: number = 2000, isVisible: boolean = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const easeOutQuart = (x: number): number => {
      return 1 - Math.pow(1 - x, 4);
    };

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const ratio = Math.min(progress / duration, 1);
      const easedRatio = easeOutQuart(ratio);
      setCount(Math.round(easedRatio * target));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(updateCount);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, isVisible]);

  return count;
}
