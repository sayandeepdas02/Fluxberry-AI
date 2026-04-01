"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────
   PREMIUM FEATURE SECTION (WHY FLUXBERRY AI)
   3-Column Modern SaaS Structure
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
              (card as HTMLElement).style.transitionDelay = `${index * 150}ms`;
              card.classList.add("visible");
            });
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="expertise"
      className="section-enter relative w-full bg-background/50"
      style={{
        paddingTop: "clamp(80px, 12vw, 120px)",
        paddingBottom: "clamp(80px, 12vw, 120px)",
      }}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 -z-10 pointer-events-none" 
           style={{ 
             backgroundImage: "radial-gradient(var(--line) 1px, transparent 1px)", 
             backgroundSize: "24px 24px",
             opacity: 0.5,
             maskImage: "linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)"
           }} 
      />

      <div className="mx-auto flex flex-col items-center relative z-10 w-full px-6 sm:px-8 max-w-[1200px] border-x border-line">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center justify-center text-center mb-16 md:mb-20">
          <div
            className="inline-flex items-center font-medium bg-background border border-line rounded-full shadow-sm"
            style={{
              padding: "6px 16px",
              gap: "8px",
              fontSize: "13px",
              color: "var(--foreground)",
              marginBottom: "24px",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Our Expertise</span>
          </div>

          <h2
            className="tracking-tight text-foreground text-balance"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              lineHeight: "1.1",
              maxWidth: "800px",
              letterSpacing: "-0.02em",
            }}
          >
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">Fluxberry AI</span>?
          </h2>

          <p
            className="text-muted-foreground font-normal"
            style={{
              fontSize: "clamp(1.125rem, 2vw, 1.25rem)",
              lineHeight: "1.6",
              maxWidth: "600px",
              marginTop: "24px",
            }}
          >
            Effortlessly set up, integrate, and optimize your hiring workflow with intelligent automation.
          </p>
        </div>

        {/* ═══ PREMIUM 3-COLUMN GRID ═══ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-8 lg:gap-10 mx-auto max-w-[1100px]">
          
          {/* Card 1: Evaluation (Sign up gear style) -> Maps to Smart Screening per prompt specs */}
          <FeatureCard
            title="Smart Screening"
            description="Analyze and shortlist top candidates instantly using AI."
            illustration={<Image src="/illustrations/img2.png" alt="Screening" width={180} height={180} className="object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105" />}
            delay={0}
          />
          
          {/* Card 2: Scheduling / Integration (Blocks) */}
          <FeatureCard
            title="Seamless Scheduling"
            description="Automatically schedule interviews across calendars without manual effort."
            illustration={<Image src="/illustrations/img1.png" alt="Scheduling" width={180} height={180} className="object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105" />}
            delay={1}
          />
          
          {/* Card 3: Evaluation (Gear) */}
          <FeatureCard
            title="Intelligent Evaluation"
            description="Score candidates based on role fit, skills, and performance."
            illustration={<Image src="/illustrations/img3.png" alt="Evaluation" width={180} height={180} className="object-contain drop-shadow-sm transition-transform duration-500 hover:scale-105" />}
            delay={2}
          />

        </div>
      </div>

      <style jsx global>{`
        .agent-card-enter {
          opacity: 0;
          transform: translateY(24px) scale(0.98);
          transition: opacity 400ms cubic-bezier(0.2, 0.8, 0.2, 1), transform 400ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .agent-card-enter.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   FEATURE CARD — Premium 3-column setup
   ───────────────────────────────────────────────── */
function FeatureCard({
  title,
  description,
  illustration,
  delay
}: {
  title: string;
  description: string;
  illustration: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className={cn(
        "agent-card-enter group relative flex flex-col overflow-hidden",
        "bg-white backdrop-blur-sm",
        "border border-line/60 rounded-2xl",
        "hover:border-primary/30",
        "transition-all duration-300 ease-out cursor-pointer",
        "hover:shadow-[0_12px_40px_-12px_rgba(85,97,200,0.12)] hover:-translate-y-1"
      )}
      style={{ padding: "40px 32px" }}
    >
      {/* Large Illustration Area */}
      <div className="w-full flex items-center justify-center mb-10 overflow-visible relative h-[180px]">
        {/* Subtle glow behind illustration */}
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-[1.5] transition-opacity opacity-0 group-hover:opacity-100" />
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {illustration}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col mt-auto pb-2">
        <h3 className="font-semibold text-neutral-900 text-xl mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-neutral-500 font-normal leading-relaxed text-[15px]">
          {description}
        </p>
      </div>
    </div>
  );
}



