"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  BrainCircuit, 
  Calendar, 
  CheckCircle2, 
  User, 
  Clock, 
  ChevronRight,
  Star
} from "lucide-react";

/* ─────────────────────────────────────────────────
   PRODUCT SHOWCASE — Chanhdai-style Editorial
   Sharp edges, border-line mockups, no shadows
   ───────────────────────────────────────────────── */
export function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const steps = entry.target.querySelectorAll(".step-enter");
            steps.forEach((step, index) => {
              (step as HTMLElement).style.transitionDelay = `${index * 150}ms`;
              step.classList.add("visible");
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

  const steps = [
    {
      id: "apply",
      caption: "Candidates apply through your job postings",
      icon: <FileText className="w-5 h-5" />,
      color: "#5561c8",
      mockup: <ApplicationMockup />,
    },
    {
      id: "screen",
      caption: "AI instantly identifies top candidates",
      icon: <BrainCircuit className="w-5 h-5" />,
      color: "#8b93e0",
      mockup: <AIScreeningMockup />,
    },
    {
      id: "schedule",
      caption: "Interviews are automatically scheduled",
      icon: <Calendar className="w-5 h-5" />,
      color: "#10b981",
      mockup: <SchedulingMockup />,
    },
    {
      id: "onboard",
      caption: "Decisions and onboarding handled in one place",
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "#3b82f6",
      mockup: <OnboardingMockup />,
    },
  ];

  return (
    <section
      ref={sectionRef}
      id="product-tour"
      className="section-enter relative w-full screen-line-top screen-line-bottom bg-muted/30"
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
            <SettingsIcon />
            <span>Workflow Automation</span>
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
            From application to onboarding —{" "}
            <span style={{ color: "var(--primary)" }}>automated</span>
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
            Fluxberry AI manages your entire hiring workflow seamlessly.
          </p>
        </div>

        {/* ═══ FLOW STEPS ═══ */}
        <div
          className="relative mx-auto"
          style={{
            marginTop: "clamp(48px, 6vw, var(--space-16))",
            maxWidth: "960px",
          }}
        >
          {/* Central Connecting Line (Desktop Only) */}
          <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-px bg-line -translate-x-1/2 z-0" />

          <div className="flex flex-col gap-12 md:gap-0">
            {steps.map((step, index) => (
              <FlowStep
                key={step.id}
                step={step}
                index={index}
                isEven={index % 2 === 0}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .step-enter {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 500ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 500ms cubic-bezier(0.25, 0.1, 0.25, 1);
        }
        .step-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   FLOW STEP — Sharp, editorial
   ───────────────────────────────────────────────── */
function FlowStep({
  step,
  index,
  isEven,
  isLast,
}: {
  step: any;
  index: number;
  isEven: boolean;
  isLast: boolean;
}) {
  return (
    <div className="step-enter relative z-10 flex flex-col md:flex-row items-center justify-between w-full md:py-12 group">
      {/* Mobile Connection Line */}
      {!isLast && (
        <div className="md:hidden absolute left-6 top-16 bottom-[-48px] w-px bg-line z-0" />
      )}

      {/* ── Content Side ── */}
      <div
        className={cn(
          "flex w-full md:w-1/2",
          isEven ? "md:justify-end md:pr-16" : "md:order-last md:justify-start md:pl-16"
        )}
      >
        <div className="flex items-center gap-4 bg-background p-4 border border-line transition-colors duration-300 group-hover:bg-muted/50 w-full max-w-[360px] relative z-[11] ml-12 md:ml-0">
          
          {/* Mobile Icon Node */}
          <div 
            className="md:hidden absolute -left-16 flex items-center justify-center bg-background border border-line z-20"
            style={{ width: "40px", height: "40px", color: step.color }}
          >
            {step.icon}
          </div>

          <div
            className="flex items-center justify-center p-3 shrink-0"
            style={{
              background: `rgba(${hexToRgb(step.color)}, 0.1)`,
              color: step.color,
            }}
          >
            {step.icon}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Step 0{index + 1}
            </div>
            <h3 className="text-sm font-medium text-foreground leading-snug">
              {step.caption}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Central Node (Desktop Only) ── */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center bg-background border border-line z-20 transition-transform duration-300 group-hover:scale-110" style={{ width: "48px", height: "48px", color: step.color }}>
        {step.icon}
      </div>

      {/* ── Mockup Side ── */}
      <div
        className={cn(
          "w-full md:w-1/2 mt-6 md:mt-0 pl-12 md:pl-0",
          isEven ? "md:pl-16" : "md:order-first md:pr-16"
        )}
      >
        <div className="relative w-full max-w-[400px] mx-auto md:mx-0">
           {step.mockup}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   MOCKUP COMPONENTS — All sharp, no rounded corners
   ───────────────────────────────────────────────── */

const MockupContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative overflow-hidden bg-background border border-line z-10">
    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line bg-muted/30">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
      <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
    </div>
    <div className="p-4 bg-background min-h-[180px]">
      {children}
    </div>
  </div>
);

function ApplicationMockup() {
  return (
    <MockupContainer>
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-24 bg-muted" />
          <div className="h-6 w-16 bg-primary/10 flex mx-auto items-center justify-center">
            <span className="text-[10px] font-medium text-primary">New</span>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 border border-line hover:bg-muted/50 transition-colors">
            <div className="w-8 h-8 bg-muted flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="h-3 w-20 bg-muted-foreground/20 mb-1.5" />
              <div className="h-2 w-32 bg-muted" />
            </div>
            <ChevronRight className="w-4 h-4 text-muted" />
          </div>
        ))}
      </div>
    </MockupContainer>
  );
}

function AIScreeningMockup() {
  return (
    <MockupContainer>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center text-primary shrink-0 font-medium text-sm">
              TC
            </div>
            <div className="pt-1">
              <div className="h-3.5 w-24 bg-foreground/80 mb-2" />
              <div className="h-2 w-16 bg-muted-foreground/30" />
            </div>
          </div>
          <div className="w-12 h-12 border-[3px] border-[#8b93e0] border-t-muted flex items-center justify-center">
            <span className="text-xs font-bold text-[#5561c8]">98%</span>
          </div>
        </div>

        <div className="pt-2 border-t border-line">
           <div className="flex items-center gap-2 mb-3">
              <SparkleSmall className="text-[#8b93e0]" />
              <span className="text-xs font-semibold text-[#5561c8]">AI Analysis</span>
           </div>
           <div className="space-y-2">
             <div className="h-2 w-full bg-muted" />
             <div className="h-2 w-[85%] bg-muted" />
             <div className="h-2 w-[60%] bg-muted" />
           </div>
        </div>
      </div>
    </MockupContainer>
  );
}

function SchedulingMockup() {
  return (
    <MockupContainer>
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
           <span className="text-xs font-medium text-foreground">Available Slots</span>
           <div className="flex gap-1">
              <div className="w-6 h-6 bg-muted flex items-center justify-center"><ChevronRight className="w-3 h-3 rotate-180" /></div>
              <div className="w-6 h-6 bg-muted flex items-center justify-center"><ChevronRight className="w-3 h-3" /></div>
           </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
           {["Mon", "Tue", "Wed"].map((day, i) => (
             <div key={day} className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase">{day}</span>
                <div className={cn("w-full py-2 text-center text-[11px]", i === 1 ? "bg-[#10b981]/10 text-[#10b981] font-medium border border-[#10b981]/20" : "bg-muted text-muted-foreground")}>
                  09:00
                </div>
                <div className={cn("w-full py-2 text-center text-[11px]", i === 0 ? "bg-[#10b981]/10 text-[#10b981] font-medium border border-[#10b981]/20" : "bg-muted text-muted-foreground")}>
                  13:30
                </div>
                <div className="w-full py-2 bg-muted text-center text-[11px] text-muted-foreground">
                  15:00
                </div>
             </div>
           ))}
        </div>
        
        <div className="mt-4 flex items-center gap-2 p-2 bg-[#10b981]/5 border border-[#10b981]/10">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
          <span className="text-xs text-foreground font-medium">Interview confirmed for Tue, 09:00 AM</span>
        </div>
      </div>
    </MockupContainer>
  );
}

function OnboardingMockup() {
  return (
    <MockupContainer>
       <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
             <div className="h-4 w-28 bg-muted" />
             <div className="flex -space-x-2">
                <div className="w-6 h-6 bg-[#3b82f6] border-2 border-white" />
                <div className="w-6 h-6 bg-indigo-400 border-2 border-white" />
             </div>
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3">
               <div className="w-5 h-5 bg-[#3b82f6] flex items-center justify-center text-white">
                 <CheckCircle2 className="w-3 h-3" />
               </div>
               <div className="flex-1 h-2 bg-muted" />
             </div>
             
             <div className="flex items-center gap-3">
               <div className="w-5 h-5 bg-[#3b82f6] flex items-center justify-center text-white">
                 <CheckCircle2 className="w-3 h-3" />
               </div>
               <div className="flex-1 h-2 bg-muted" />
             </div>

             <div className="flex items-center gap-3">
               <div className="w-5 h-5 border-2 border-[#3b82f6] bg-white flex items-center justify-center">
                 <div className="w-1.5 h-1.5 bg-[#3b82f6]" />
               </div>
               <div className="flex-1 h-2 bg-[#3b82f6]/20" />
             </div>
             
             <div className="flex items-center gap-3 opacity-50">
               <div className="w-5 h-5 border-2 border-muted bg-white flex items-center justify-center" />
               <div className="flex-1 h-2 bg-muted" />
             </div>
          </div>
       </div>
    </MockupContainer>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
}

function SparkleSmall({ className }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : "85, 97, 200";
}
