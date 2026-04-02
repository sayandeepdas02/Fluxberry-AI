"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/shared/layout-primitives";

/* ─────────────────────────────────────────────────
   TESTIMONIALS SECTION — Masonry Grid
   Sharp edges, border-driven cells, staggered entrance
   ───────────────────────────────────────────────── */
export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const items = entry.target.querySelectorAll(".testimonial-enter");
            items.forEach((item, index) => {
              (item as HTMLElement).style.transitionDelay = `${index * 150}ms`;
              item.classList.add("visible");
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <SectionWrapper ref={sectionRef} id="testimonials" className="section-enter bg-background">
      <div className="w-full relative">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center justify-center text-center pb-12 md:pb-16">
          <h2
            className="font-semibold tracking-tight text-foreground text-balance"
            style={{
              fontSize: "clamp(1.75rem, 4vw, var(--text-display))",
              lineHeight: "1.12",
              maxWidth: "600px",
              letterSpacing: "-0.02em",
            }}
          >
            Trusted by Startups and the world's <span style={{ color: "var(--primary)" }}>largest companies</span>
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
            Let's hear how Fluxberry AI clients feel about our service
          </p>
        </div>

        {/* ═══ MASONRY GRID (Brutalist Boxed Layout) ═══ */}
        <div className="lg:grid lg:grid-cols-3 flex flex-col w-full gap-0 border border-line">
          
          {/* Column 1 */}
          <div className="md:flex lg:flex-col lg:h-full gap-0">
            <TestimonialCard 
              className="lg:flex-[7] flex-[6] bg-muted/20 border-b lg:border-r border-line text-foreground"
              quote="Fluxberry has been a game-changer for us. Their service is top-notch and their team is incredibly responsive."
              name="Guillermo Rauch"
              role="CEO of Enigma"
              image="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=687&auto=format&fit=crop"
              highlight
            />
            <TestimonialCard 
              className="lg:flex-[3] flex-[4] bg-primary text-white border-b lg:border-b-0 lg:border-r border-line"
              quote="We've seen incredible results with Fluxberry. Their expertise and dedication is simply unmatched."
              name="Rika Shinoda"
              role="CEO of Kintsugi"
              image="https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?q=80&w=687&auto=format&fit=crop"
            />
          </div>

          {/* Column 2 */}
          <div className="md:flex lg:flex-col lg:h-full gap-0">
            <TestimonialCard 
              className="bg-background text-foreground border-b lg:border-r border-line hover:bg-muted/50 transition-colors"
              quote="Their team is highly professional, and their innovative solutions have truly transformed the way we operate."
              name="Reacher"
              role="CEO of OdeaoLabs"
              image="https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=1021&auto=format&fit=crop"
            />
            <TestimonialCard 
              className="bg-background text-foreground border-b lg:border-r border-line hover:bg-muted/50 transition-colors"
              quote="We're extremely satisfied with Fluxberry. Their expertise and dedication have exceeded our expectations."
              name="John"
              role="CEO of Labsbo"
              image="https://images.unsplash.com/photo-1615109398623-88346a601842?q=80&w=687&auto=format&fit=crop"
            />
            <TestimonialCard 
              className="bg-background text-foreground border-b lg:border-b-0 lg:border-r border-line hover:bg-muted/50 transition-colors"
              quote="Their customer support is absolutely exceptional. They are always available, incredibly helpful."
              name="Steven Sunny"
              role="CEO of boxefi"
              image="https://images.unsplash.com/photo-1740102074295-c13fae3e4f8a?q=80&w=687&auto=format&fit=crop"
            />
          </div>

          {/* Column 3 */}
          <div className="md:flex lg:flex-col lg:h-full gap-0">
            <TestimonialCard 
              className="lg:flex-[3] flex-[4] bg-primary/10 text-foreground border-b border-line hover:bg-primary/20 transition-colors"
              quote="Fluxberry has been a key partner in our growth journey."
              name="Guillermo Rauch"
              role="CEO of OdeaoLabs"
              image="https://images.unsplash.com/photo-1563237023-b1e970526dcb?q=80&w=765&auto=format&fit=crop"
            />
            <TestimonialCard 
              className="lg:flex-[7] flex-[6] bg-foreground text-background"
              quote="Fluxberry has been a true game-changer for us. Their exceptional service, combined with their deep expertise and commitment to excellence, has made a significant impact on our business."
              name="Paul Brauch"
              role="CTO of Spectrum"
              image="https://images.unsplash.com/photo-1590086782957-93c06ef21604?q=80&w=687&auto=format&fit=crop"
              highlight
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        .testimonial-enter {
          opacity: 0;
          filter: blur(8px);
          transform: translateY(16px);
          transition: opacity 600ms ease-out, transform 600ms ease-out, filter 600ms ease-out;
        }
        .testimonial-enter.visible {
          opacity: 1;
          filter: blur(0px);
          transform: translateY(0);
        }
      `}</style>
    </SectionWrapper>
  );
}

function TestimonialCard({
  className,
  quote,
  name,
  role,
  image,
  highlight = false,
}: {
  className?: string;
  quote: string;
  name: string;
  role: string;
  image: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("testimonial-enter flex flex-col justify-between relative overflow-hidden p-6 md:p-8", className)}>
      {/* Brutalist Matrix Decor for highlighted cards */}
      {highlight && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay"
             style={{
               backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
               backgroundSize: "24px 24px",
             }}
        />
      )}
      <article className="mt-auto relative z-10 flex flex-col h-full">
        <p className="text-base md:text-[17px] leading-[1.6]">
          "{quote}"
        </p>
        <div className="flex justify-between items-end pt-8 mt-auto">
          <div>
            <h2 className="font-semibold text-lg tracking-tight">
              {name}
            </h2>
            <p className="text-sm opacity-80">
              {role}
            </p>
          </div>
          {/* Sharp Brutalist Avatar */}
          <div className="w-14 h-14 shrink-0 overflow-hidden bg-muted">
            <Image
              src={image}
              alt={name}
              width={100}
              height={100}
              className="w-full h-full object-cover grayscale origin-center hover:scale-105 hover:grayscale-0 transition-all duration-300"
            />
          </div>
        </div>
      </article>
    </div>
  );
}
