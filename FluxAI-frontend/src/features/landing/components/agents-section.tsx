"use client";

import { useEffect, useRef } from "react";
import { Search, Calendar, BrainCircuit, UserPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────
   AI AGENTS SECTION — Chanhdai-style Editorial
   Sharp cards, border-driven, no shadows
   ───────────────────────────────────────────────── */
export function AgentsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const cards = entry.target.querySelectorAll(".agent-card-enter");
            cards.forEach((card, index) => {
              (card as HTMLElement).style.transitionDelay = `${index * 100}ms`;
              card.classList.add("visible");
            });
          }
        });
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
      id="agents"
      className="section-enter relative w-full screen-line-top screen-line-bottom"
      style={{
        paddingTop: "clamp(64px, 8vw, var(--space-24))",
        paddingBottom: "clamp(64px, 8vw, var(--space-24))",
      }}
    >
      <div
        className="mx-auto relative z-10"
        style={{
          paddingInline: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center justify-center text-center">
          {/* Section Badge — sharp rectangular */}
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Intelligent Core</span>
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
            Meet your <span style={{ color: "#5561c8" }}>AI hiring agents</span>
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
            Fluxberry AI replaces manual workflows with intelligent agents that handle every step of hiring.
          </p>
        </div>

        {/* ═══ AGENTS GRID ═══ */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 mx-auto"
          style={{
            marginTop: "var(--space-12)",
            maxWidth: "960px",
          }}
        >
          <AgentCard
            icon={<Search className="w-5 h-5" />}
            title="Screening Agent"
            description="Analyzes and shortlists top candidates instantly using AI."
            accentColor="#5561c8"
            position="top-left"
          />
          
          <AgentCard
            icon={<Calendar className="w-5 h-5" />}
            title="Scheduling Agent"
            description="Automatically schedules interviews across calendars."
            accentColor="#10b981"
            position="top-right"
          />
          
          <AgentCard
            icon={<BrainCircuit className="w-5 h-5" />}
            title="Evaluation Agent"
            description="Scores candidates based on role fit and performance."
            accentColor="#f59e0b"
            position="bottom-left"
          />
          
          <AgentCard
            icon={<UserPlus className="w-5 h-5" />}
            title="Onboarding Agent"
            description="Streamlines onboarding workflows and documentation."
            accentColor="#0ea5e9"
            position="bottom-right"
          />
        </div>
      </div>

      <style jsx global>{`
        .agent-card-enter {
          opacity: 0;
          transform: translateY(16px);
          transition: opacity 400ms ease-out, transform 400ms ease-out;
        }
        .agent-card-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   AGENT CARD — Sharp rectangle, border-line grid
   Looks like editorial grid cells with shared borders
   ───────────────────────────────────────────────── */
function AgentCard({
  icon,
  title,
  description,
  accentColor,
  position,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accentColor: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}) {
  return (
    <div
      className={cn(
        "agent-card-enter group relative flex flex-col overflow-hidden",
        "bg-background",
        "border border-line",
        "transition-colors duration-200 ease-out cursor-pointer",
        "hover:bg-muted/50",
        /* Collapse shared borders for grid effect */
        position === "top-right" && "md:-ml-px",
        position === "bottom-left" && "md:-mt-px",
        position === "bottom-right" && "md:-ml-px md:-mt-px",
        "-mt-px md:mt-0",
        position === "top-right" && "-mt-px md:mt-0",
      )}
      style={{
        padding: "var(--space-8)",
      }}
    >
      {/* Icon Wrapper — sharp rectangle */}
      <div
        className="flex items-center justify-center"
        style={{
          width: "44px",
          height: "44px",
          marginBottom: "var(--space-4)",
          background: `rgba(${hexToRgb(accentColor)}, 0.08)`,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
        <h3
          className="font-semibold text-foreground"
          style={{ fontSize: "var(--text-heading-sm)" }}
        >
          {title}
        </h3>
        
        <p
          className="text-muted-foreground font-normal line-clamp-2"
          style={{ 
            fontSize: "var(--text-body-sm)",
            lineHeight: "1.5"
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : "85, 97, 200";
}
