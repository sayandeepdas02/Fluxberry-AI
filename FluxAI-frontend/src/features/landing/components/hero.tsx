"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";
import { FallingPattern } from "@/components/ui/falling-pattern";

import { Cover } from "@/components/ui/cover";

/* ─────────────────────────────────────────────────
   HERO SECTION — Chanhdai-style Editorial
   Flat bg, sharp edges, border-driven depth
   ───────────────────────────────────────────────── */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const rect = img.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Subtle tilt for a large hero image (using 80 as divisor for smaller rotation angles)
    const x = (mouseX - rect.width / 2) / 80;
    const y = (mouseY - rect.height / 2) / 80;

    img.style.transform = `scale(1.01) rotateY(${x}deg) rotateX(${-y}deg)`;
    
    // Subtle shadow shift
    const shadowX = -x;
    const shadowY = -y + 15;
    img.style.boxShadow = `${shadowX}px ${shadowY}px 40px -10px rgba(0,0,0,0.15)`;
  };

  const handleMouseLeave = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    
    img.style.transform = `rotateY(0deg) rotateX(0deg) scale(1)`;
    img.style.boxShadow = `0px 10px 30px -10px rgba(0,0,0,0.08)`;
  };

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
            {" "}<Cover>Hiring Automation</Cover> for growing teams
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
              <SharpButton className="!bg-black !text-white !border-black hover:!bg-black/90">
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
            perspective: "2000px",
          }}
        >
          <img 
            ref={imgRef}
            src="/HeroDashboard.png" 
            alt="Fluxberry AI Dashboard" 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full h-auto cursor-pointer"
            style={{
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              transformStyle: "preserve-3d",
              willChange: "transform",
              boxShadow: "0px 10px 30px -10px rgba(0,0,0,0.08)",
            }}
          />
        </div>
      </div>
    </SectionWrapper>
  );
}