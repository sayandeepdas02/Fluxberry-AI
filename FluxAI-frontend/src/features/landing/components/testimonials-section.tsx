"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

/* ─────────────────────────────────────────────────
   TESTIMONIALS SECTION — Chanhdai-style Editorial
   Sharp quote card, no shadows, no external images
   ───────────────────────────────────────────────── */

const testimonials = [
  {
    id: 1,
    quote: "Fluxberry reduced our hiring time by more than half — we can now focus on building, not screening.",
    name: "Sarah Jenkins",
    role: "VP of Engineering",
    company: "TechNexus",
    initials: "SJ",
  },
  {
    id: 2,
    quote: "The AI instantly shortlists exactly who we need. It's like having a senior technical recruiter working 24/7.",
    name: "David Miller",
    role: "CEO",
    company: "Horizon Solutions",
    initials: "DM",
  },
  {
    id: 3,
    quote: "Automated scheduling and evaluation completely eliminated our administrative bottlenecks. Simply incredible.",
    name: "Elena Rodriguez",
    role: "Head of Talent",
    company: "Scale AI",
    initials: "ER",
  },
];

export function TestimonialsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 500);
  };

  const activeTestimonial = testimonials[activeIndex];

  return (
    <section
      ref={sectionRef}
      id="testimonials"
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
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Testimonial</span>
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
            Loved by <span style={{ color: "var(--primary)" }}>modern hiring teams</span>
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
            See how teams are transforming their hiring with Fluxberry AI.
          </p>
        </div>

        {/* ═══ QUOTE CARD — Sharp, bordered ═══ */}
        <div
          className="relative mx-auto mt-16 md:mt-24"
          style={{ maxWidth: "880px" }}
        >
          <div className="bg-background border border-line p-6 md:p-12">
             <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
               
               {/* ── AVATAR — Sharp square with initials ── */}
               <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 relative overflow-hidden border border-line flex items-center justify-center bg-muted">
                  <span 
                    className={cn(
                      " text-muted-foreground transition-all duration-500",
                      isAnimating ? "opacity-0 scale-90" : "opacity-100 scale-100"
                    )}
                    style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}
                  >
                    {activeTestimonial.initials}
                  </span>
               </div>

               {/* ── QUOTE SIDE ── */}
               <div className="flex-1 flex flex-col justify-between w-full relative">
                 {/* Decorative Quote Mark */}
                 <div className="absolute -top-6 -left-4 text-primary/5 select-none text-8xl leading-none">
                    &ldquo;
                 </div>

                 <div className="relative z-10">
                   <p 
                     className={cn(
                       "font-medium text-foreground tracking-tight",
                       "transition-all duration-500 ease-out",
                       isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                     )}
                     style={{
                       fontSize: "clamp(20px, 3vw, 24px)",
                       lineHeight: "1.4",
                     }}
                   >
                     &quot;{activeTestimonial.quote}&quot;
                   </p>
                 </div>

                 <div className="flex items-end justify-between mt-8 md:mt-12 group">
                   <div 
                     className={cn(
                       "flex flex-col transition-all duration-500 ease-out delay-75",
                       isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                     )}
                   >
                     <span className="font-semibold text-foreground text-sm md:text-base">
                       {activeTestimonial.name}
                     </span>
                     <span className="text-muted-foreground text-xs md:text-sm mt-0.5">
                       {activeTestimonial.role}, <span className="font-medium text-foreground/80">{activeTestimonial.company}</span>
                     </span>
                   </div>

                   {/* NAVIGATION ARROWS — sharp rectangles */}
                   <div className="flex gap-2 shrink-0">
                     <button
                       onClick={handlePrev}
                       disabled={isAnimating}
                       className="flex items-center justify-center w-10 h-10 border border-line bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                       aria-label="Previous testimonial"
                     >
                       <ChevronLeft className="w-5 h-5" />
                     </button>
                     <button
                       onClick={handleNext}
                       disabled={isAnimating}
                       className="flex items-center justify-center w-10 h-10 border border-line bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                       aria-label="Next testimonial"
                     >
                       <ChevronRight className="w-5 h-5" />
                     </button>
                   </div>
                 </div>

               </div>
             </div>
          </div>
        </div>

      </div>
    </section>
  );
}
