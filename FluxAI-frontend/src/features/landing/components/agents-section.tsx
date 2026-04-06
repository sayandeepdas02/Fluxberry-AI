"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/shared/layout-primitives";

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
              (card as HTMLElement).style.transitionDelay = `${index * 120}ms`;
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
    <SectionWrapper
      ref={sectionRef}
      id="expertise"
      className="section-enter bg-background py-16 md:py-24 relative"
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--line) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.4,
          maskImage:
            "linear-gradient(to bottom, transparent, white 20%, white 90%, transparent)",
        }}
      />

      <div className="flex flex-col items-center relative z-10 w-full">
        {/* HEADER */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 text-sm border border-line bg-background font-medium mb-6 rounded-none">
            <Sparkles className="w-3.5 h-3.5 text-[#5D5FEF]" />
            <span className="text-foreground text-[13px]">Our Expertise</span>
          </div>

          <h2 className="text-balance text-foreground tracking-[-0.02em] text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] font-semibold">
            Why{" "}
            <span className="text-[#5D5FEF]">
              Fluxberry AI
            </span>
            ?
          </h2>

          <p className="mt-6 text-muted-foreground text-[1.125rem] max-w-[600px] leading-[1.6]">
            Effortlessly set up, integrate, and optimize your hiring workflow
            with intelligent automation.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-[1100px] w-full mx-auto px-4">
          <FeatureCard
            title="Intelligent Talent Acquisition"
            description="Find and attract top candidates with AI-driven sourcing. Never miss the right talent."
            imageSrc="/Intelligent Talent Acquisition.png"
            delay={0}
          />
          <FeatureCard
            title="AI-Powered Assessments"
            description="Assess candidates with AI-powered tests and screenings. Make faster, smarter hiring decisions."
            imageSrc="/AI-Powered Assessments.png"
            delay={1}
          />
          <FeatureCard
            title="Seamless Hiring & Onboarding"
            description="Automate hiring from selection to onboarding. Deliver a smooth, consistent experience."
            imageSrc="/Seamless Hiring & Onboarding.png"
            delay={2}
          />
        </div>
      </div>

      <style jsx global>{`
        .agent-card-enter {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 400ms ease, transform 400ms ease;
        }
        .agent-card-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </SectionWrapper>
  );
}

/* ─────────────────────────────────────────────────
   FEATURE CARD — Premium 3-column setup
   ───────────────────────────────────────────────── */
function FeatureCard({
  title,
  description,
  imageSrc,
  delay
}: {
  title: string;
  description: string;
  imageSrc: string;
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Tilt calculation relative to center
    const x = (mouseX - rect.width / 2) / 15;
    const y = (mouseY - rect.height / 2) / 15;

    // Apply rotation to the entire card without moving independent children
    card.style.transform = `scale(1.02) rotateY(${x}deg) rotateX(${-y}deg)`;
    
    // Slight shadow shift based on tilt
    const shadowX = -x * 1.5;
    const shadowY = -y * 1.5 + 10;
    card.style.boxShadow = `${shadowX}px ${shadowY}px 30px -5px rgba(0,0,0,0.15)`;

    // Soft glow effect following cursor
    if (glowRef.current) {
      glowRef.current.style.background = `radial-gradient(circle at ${mouseX}px ${mouseY}px, rgba(255,255,255,0.3), transparent 60%)`;
      glowRef.current.style.opacity = "1";
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    
    card.style.transform = `rotateY(0deg) rotateX(0deg) scale(1)`;
    card.style.boxShadow = `0px 1px 2px 0px rgba(0,0,0,0.05)`;

    if (glowRef.current) {
      glowRef.current.style.opacity = "0";
    }
  };

  return (
    <div className="agent-card-enter w-full h-full" style={{ perspective: "1000px" }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "relative flex flex-col overflow-hidden h-full",
          "bg-white",
          "border border-[#E5E7EB] rounded-[4px]",
          "cursor-pointer shadow-sm"
        )}
        style={{
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        {/* Soft lighting effect */}
        <div
          ref={glowRef}
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300 ease-out"
          style={{ opacity: 0 }}
        />

        {/* 🖼 Top Section: Solid Primary Background with Padded Image */}
        <div className="w-full bg-[#5D5FEF] p-[16px] relative z-0">
          {/* The actual image with white border and rounding */}
          <div className="relative w-full aspect-[1.6] rounded-[6px] overflow-hidden border-[1.5px] border-white ring-1 ring-black/5 pointer-events-none">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              draggable={false}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-6 pt-[22px] pointer-events-none relative z-0 bg-white">
          <h3 className="font-bold text-[#111827] text-[18px] leading-[1.3] mb-2 tracking-[-0.01em]">
            {title}
          </h3>
          <p className="text-[#6B7280] font-normal leading-[1.6] text-[15px]">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}