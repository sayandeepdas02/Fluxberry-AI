"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { SectionWrapper } from "@/components/shared/layout-primitives";
import { User, ChevronRight, CheckCircle2 } from "lucide-react";

/* ─────────────────────────────────────────────────
   PRODUCT SHOWCASE — Tab Segmented Control
   Rigid rectangular structural grid
   ───────────────────────────────────────────────── */
export function ProductShowcase() {
  const [activeTabId, setActiveTabId] = useState("prospect");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const TABS = [
    {
      id: "prospect",
      label: "Prospect",
      content: {
        badge: "Sourcing",
        title: "Centralized talent inflow",
        description: "Fluxberry AI seamlessly integrates with your existing careers page and job boards, automatically funnelling all inbound candidates directly into a single unified pipeline.",
        buttonText: "Explore Sourcing",
        mockup: <ApplicationMockup />
      }
    },
    {
      id: "screening",
      label: "ATS Screening",
      content: {
        badge: "AI Evaluation",
        title: "Instant candidate qualification",
        description: "Our proprietary AI engine evaluates resumes against your specific job criteria in seconds, highlighting the strongest matches while systematically eliminating human bias.",
        buttonText: "See Screening Logic",
        mockup: <AIScreeningMockup />
      }
    },
    {
      id: "assessments",
      label: "Assessments",
      content: {
        badge: "Interview Logistics",
        title: "Self-serve automated scheduling",
        description: "Stop the back-and-forth emails. Fluxberry AI intelligently syncs with your team's calendars and empowers top candidates to book their own interview slots instantly.",
        buttonText: "View Scheduling",
        mockup: <SchedulingMockup />
      }
    },
    {
      id: "onboarding",
      label: "Onboarding",
      content: {
        badge: "Placement",
        title: "Zero-touch offer generation",
        description: "Once you lock in a hire, automatic background workflows trigger offer letters, provision access, and manage day-one onboarding tasks without lifting a finger.",
        buttonText: "Discover Workflows",
        mockup: <OnboardingMockup />
      }
    }
  ];

  const activeTab = TABS.find((t) => t.id === activeTabId) || TABS[0];

  return (
    <SectionWrapper ref={sectionRef} id="product-tour" className="section-enter">
      <div className="w-full relative z-10">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="text-xs border border-line px-3 py-1 bg-muted/20 text-muted-foreground uppercase tracking-widest font-medium">
            Our Products
          </div>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            From application to onboarding — automated
          </h2>

          <p className="text-muted-foreground max-w-[600px] text-lg">
            Fluxberry AI manages your entire hiring workflow seamlessly.
          </p>
        </div>

        {/* ═══ TABS SYSTEM (TOP BAR) ═══ */}
        <div className="w-full flex border border-line overflow-x-auto hide-scrollbar">
          {TABS.map((tab, idx) => {
            const isActive = activeTabId === tab.id;
            const isLast = idx === TABS.length - 1;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "flex-1 px-4 lg:px-6 py-4 text-sm font-medium transition-colors cursor-pointer text-center whitespace-nowrap",
                  !isLast && "border-r border-line",
                  isActive
                    ? "bg-[#5561c8] text-white"
                    : "text-muted-foreground bg-background hover:bg-muted/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══ CONTENT PANEL (MAIN BOX) ═══ */}
        <div className="mt-10 border border-line bg-background p-8 lg:p-12 transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT SIDE (TEXT BLOCK) */}
            <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 fade-in duration-500">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary border border-primary/20 bg-primary/5 px-3 py-1 w-fit">
                {activeTab.content.badge}
              </div>

              <h3 className="text-3xl lg:text-4xl font-semibold tracking-tight leading-tight text-foreground">
                {activeTab.content.title}
              </h3>

              <p className="text-muted-foreground max-w-[480px] text-[17px] leading-[1.6]">
                {activeTab.content.description}
              </p>

              <button
                className="mt-2 border border-line bg-background text-foreground px-6 py-3 text-sm font-medium hover:bg-muted active:scale-[0.98] transition-all cursor-pointer w-fit rounded-none"
              >
                {activeTab.content.buttonText}
              </button>
            </div>

            {/* RIGHT SIDE (VISUAL PANEL) */}
            <div className="border border-line h-[360px] lg:h-[420px] w-full flex items-center justify-center bg-muted/20 relative overflow-hidden animate-in slide-in-from-right-4 fade-in duration-500 p-6 lg:p-10">
              {/* Decorative Matrix Background */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
                style={{
                  backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                  backgroundSize: "24px 24px"
                }}
              />
              <div className="relative w-full max-w-[440px] shadow-2xl shadow-black/5">
                {activeTab.content.mockup}
              </div>
            </div>

          </div>
        </div>

      </div>
    </SectionWrapper>
  );
}


/* ─────────────────────────────────────────────────
   MOCKUP COMPONENTS — All sharp, no rounded corners
   ───────────────────────────────────────────────── */

const MockupContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative overflow-hidden bg-background border border-line z-10 rounded-none w-full">
    <div className="flex items-center gap-1.5 px-4 py-3 border-b border-line bg-muted/30">
      <div className="w-2.5 h-2.5 rounded-none bg-red-400" />
      <div className="w-2.5 h-2.5 rounded-none bg-amber-400" />
      <div className="w-2.5 h-2.5 rounded-none bg-green-400" />
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
          <div className="h-6 w-16 bg-[#5561c8]/10 flex mx-auto items-center justify-center border border-[#5561c8]/20">
            <span className="text-[10px] font-medium text-[#5561c8]">12 New</span>
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 border border-line hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="w-8 h-8 bg-muted flex items-center justify-center shrink-0 border border-line">
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
            <div className="w-10 h-10 bg-[#8b93e0]/10 border border-[#8b93e0]/20 flex items-center justify-center text-[#8b93e0] shrink-0 font-medium text-sm">
              TC
            </div>
            <div className="pt-1">
              <div className="h-3.5 w-24 bg-foreground/80 mb-2" />
              <div className="h-2 w-16 bg-muted-foreground/30" />
            </div>
          </div>
          <div className="w-12 h-12 border-[3px] border-[#8b93e0] border-t-muted flex items-center justify-center bg-[#8b93e0]/5">
            <span className="text-xs text-[#8b93e0] font-semibold">98%</span>
          </div>
        </div>

        <div className="pt-3 border-t border-line mt-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-[#8b93e0] uppercase tracking-wider">AI Confidence Matrix</span>
          </div>
          <div className="space-y-2">
            <div className="h-2 w-full bg-muted" />
            <div className="h-2 w-[85%] bg-muted" />
            <div className="h-2 w-[60%] bg-[#5561c8]/40" />
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
          <span className="text-xs font-medium text-foreground uppercase tracking-widest">Available Slots</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-muted flex items-center justify-center border border-line"><ChevronRight className="w-3 h-3 rotate-180" /></div>
            <div className="w-6 h-6 bg-muted flex items-center justify-center border border-line"><ChevronRight className="w-3 h-3" /></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["Mon", "Tue", "Wed"].map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-2">
              <span className="text-[10px] text-muted-foreground uppercase">{day}</span>
              <div className={cn("w-full py-2 text-center text-[11px] cursor-pointer", i === 1 ? "bg-[#10b981]/10 text-[#10b981] font-medium border border-[#10b981]/20" : "bg-muted text-muted-foreground border border-line hover:border-muted-foreground/30")}>
                09:00
              </div>
              <div className={cn("w-full py-2 text-center text-[11px] cursor-pointer", i === 0 ? "bg-[#10b981]/10 text-[#10b981] font-medium border border-[#10b981]/20" : "bg-muted text-muted-foreground border border-line hover:border-muted-foreground/30")}>
                13:30
              </div>
              <div className="w-full py-2 bg-muted text-center text-[11px] text-muted-foreground border border-line">
                15:00
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 p-3 bg-[#10b981]/5 border border-[#10b981]/20">
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
            <div className="w-6 h-6 bg-[#3b82f6] border border-white" />
            <div className="w-6 h-6 bg-indigo-400 border border-white" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#3b82f6] flex items-center justify-center text-white border border-[#3b82f6]">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <div className="flex-1 h-2 bg-muted" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#3b82f6] flex items-center justify-center text-white border border-[#3b82f6]">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <div className="flex-1 h-2 bg-muted" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border border-[#3b82f6] bg-background flex items-center justify-center shadow-[inset_0_0_0_2px_var(--background)]">
              <div className="w-2 h-2 bg-[#3b82f6]" />
            </div>
            <div className="flex-1 h-2 bg-[#3b82f6]/20" />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border border-muted bg-background flex items-center justify-center" />
            <div className="flex-1 h-2 bg-muted" />
          </div>
        </div>
      </div>
    </MockupContainer>
  )
}
