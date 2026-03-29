"use client";

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
   PRODUCT SHOWCASE — Stacked Card Scroll System
   Premium SaaS UI, hard overlap, no transparency
   ───────────────────────────────────────────────── */
export function ProductShowcase() {
  const steps = [
    {
      id: "apply",
      caption: "Candidates apply through your job postings",
      description: "Fluxberry AI seamlessly integrates with your existing careers page and job boards, centralizing all inbound applications into a single, unified pipeline.",
      icon: <FileText className="w-5 h-5" />,
      color: "#5561c8",
      mockup: <ApplicationMockup />,
    },
    {
      id: "screen",
      caption: "AI instantly identifies top candidates",
      description: "Our proprietary AI engine evaluates resumes against your specific job criteria in seconds, highlighting the strongest matches while eliminating bias.",
      icon: <BrainCircuit className="w-5 h-5" />,
      color: "#8b93e0",
      mockup: <AIScreeningMockup />,
    },
    {
      id: "schedule",
      caption: "Interviews are automatically scheduled",
      description: "Stop the back-and-forth emails. Fluxberry AI syncs with your team's calendars and lets top candidates book their own interview slots instantly.",
      icon: <Calendar className="w-5 h-5" />,
      color: "#10b981",
      mockup: <SchedulingMockup />,
    },
    {
      id: "onboard",
      caption: "Decisions and onboarding handled in one place",
      description: "Once you make a hire, automatic workflows trigger offer letters, background checks, and day-one onboarding tasks without lifting a finger.",
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "#3b82f6",
      mockup: <OnboardingMockup />,
    },
  ];

  return (
    <section
      id="product-tour"
      className="relative w-full bg-background"
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

        {/* ═══ STACKED CARDS SYSTEM ═══ */}
        <div
          className="relative mx-auto w-full"
          style={{
            marginTop: "clamp(48px, 6vw, var(--space-16))",
            maxWidth: "1080px",
          }}
        >
          <div className="flex flex-col">
            {steps.map((step, index) => (
              <FlowStep
                key={step.id}
                step={step}
                index={index}
                isEven={index % 2 === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   FLOW STEP — Sticky Stacked Card
   ───────────────────────────────────────────────── */
function FlowStep({
  step,
  index,
  isEven,
}: {
  step: any;
  index: number;
  isEven: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col md:flex-row w-full bg-background overflow-hidden",
        "border border-line rounded-2xl md:rounded-[2rem]",
        "mb-12 md:mb-0 md:sticky"
      )}
      style={{
        // STICKY LOGIC
        top: "clamp(80px, 10vh, 120px)",
        height: "max(560px, calc(100vh - 140px))",
        // Z-INDEX ESCALATION
        zIndex: index + 1,
        // SOLID BACKGROUND, NO OPACITY FADES
        opacity: 1,
        // ELEVATION HIERARCHY SHADOW
        boxShadow: index === 0 ? "none" : `0 -${12 + index * 4}px ${32 + index * 8}px -12px rgba(85, 97, 200, ${0.03 + index * 0.01})`,
      }}
    >
      {/* ── Content Side ── */}
      <div
        className={cn(
          "flex flex-col justify-center w-full md:w-1/2 p-8 md:p-14 lg:p-16 xl:p-20",
          isEven ? "md:order-last" : "md:order-first"
        )}
      >
        <div className="flex items-center gap-4 mb-8">
          <div
            className="flex items-center justify-center shrink-0 w-12 h-12 rounded-xl"
            style={{
              background: `rgba(${hexToRgb(step.color)}, 0.1)`,
              color: step.color,
            }}
          >
            {step.icon}
          </div>
          <div>
            <div className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Step 0{index + 1}
            </div>
          </div>
        </div>

        <h3 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight leading-snug mb-5 text-balance">
          {step.caption}
        </h3>
        
        <p className="text-muted-foreground text-[17px] leading-relaxed font-normal">
          {step.description}
        </p>
      </div>

      {/* ── Mockup Side ── */}
      <div
        className={cn(
          "relative flex items-center justify-center w-full md:w-1/2 p-8 md:p-12 lg:p-16 xl:p-20 bg-muted/20",
          "border-t md:border-t-0",
          !isEven ? "md:border-l border-line" : "md:border-r border-line"
        )}
      >
        <div className="relative w-full max-w-[440px] mx-auto md:scale-95 transition-transform duration-700 md:group-hover:scale-100 origin-center">
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
