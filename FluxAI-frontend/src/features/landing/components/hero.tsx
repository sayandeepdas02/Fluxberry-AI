"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  Calendar,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Bot,
  BrainCircuit,
  Zap,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";
import { FallingPattern } from "@/components/ui/falling-pattern";

/* ─────────────────────────────────────────────────
   HERO SECTION — Chanhdai-style Editorial
   Flat bg, sharp edges, border-driven depth
   ───────────────────────────────────────────────── */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

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
            Your{" "}
            <span style={{ color: "#5561c8" }}>AI Native</span>
            {" "}Hiring Automation for growing teams
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
              <SharpButton variant="outline">
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
    maxWidth: "960px",
  }}
>
  <DashboardMockup />
</div>
      </div>
    </SectionWrapper>
  );
}

/* ─────────────────────────────────────────────────
   DASHBOARD MOCKUP — Sharp edges, ring border
   ───────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="relative overflow-hidden border border-line bg-white"
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between border-b border-line bg-muted/30"
        style={{ padding: "10px 20px" }}
      >
        <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <div className="w-3 h-3 rounded-none bg-red-400" />
            <div className="w-3 h-3 rounded-none bg-amber-400" />
            <div className="w-3 h-3 rounded-none bg-green-400" />
          </div>
          <div className="flex items-center" style={{ gap: "var(--space-2)" }}>
            <BrainCircuit className="w-4 h-4" style={{ color: "#5561c8" }} />
            <span
              className="font-semibold text-foreground"
              style={{ fontSize: "var(--text-caption)" }}
            >
              Fluxberry AI
            </span>
          </div>
        </div>
        <div
          className="hidden sm:flex items-center border border-line bg-white"
          style={{ padding: "5px 12px", gap: "var(--space-2)" }}
        >
          <Search className="w-3.5 h-3.5 text-muted-foreground" />
          <span
            className="text-muted-foreground"
            style={{ fontSize: "var(--text-micro)" }}
          >
            Search candidates...
          </span>
        </div>
      </div>

      {/* ── Dashboard Content ── */}
      <div className="flex">
        {/* Sidebar */}
        <div
          className="hidden md:flex flex-col border-r border-line bg-muted/20"
          style={{
            width: "200px",
            padding: "var(--space-4)",
            gap: "var(--space-1)",
          }}
        >
          <SidebarItem icon={<BarChart3 className="w-4 h-4" />} label="Dashboard" active />
          <SidebarItem icon={<Users className="w-4 h-4" />} label="Candidates" />
          <SidebarItem icon={<Calendar className="w-4 h-4" />} label="Interviews" />
          <SidebarItem icon={<MessageSquare className="w-4 h-4" />} label="Messages" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1" style={{ padding: "var(--space-5)" }}>
          {/* Stats Row */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4"
            style={{ gap: "var(--space-3)", marginBottom: "var(--space-5)" }}
          >
            <StatCard label="Applications" value="1,248" change="+15%" positive />
            <StatCard label="Shortlisted" value="312" change="+8%" positive />
            <StatCard label="Interviews" value="89" change="+22%" positive />
            <StatCard label="Offers Sent" value="24" change="+3%" positive />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "var(--space-3)" }}>
            {/* Pipeline */}
            <div
              className="border border-line bg-muted/20"
              style={{ padding: "var(--space-4)" }}
            >
              <span
                className="font-semibold text-foreground block"
                style={{ fontSize: "var(--text-body-sm)", marginBottom: "var(--space-3)" }}
              >
                Hiring Pipeline
              </span>
              <div className="flex flex-col" style={{ gap: "var(--space-2)" }}>
                <PipelineBar label="Sourced" width="100%" color="#5561c8" value="1,248" />
                <PipelineBar label="Screened" width="65%" color="#6e79d6" value="812" />
                <PipelineBar label="Interviewed" width="28%" color="#8b93e0" value="350" />
                <PipelineBar label="Offered" width="8%" color="#a8b0ea" value="98" />
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="border border-line bg-muted/20"
              style={{ padding: "var(--space-4)" }}
            >
              <span
                className="font-semibold text-foreground block"
                style={{ fontSize: "var(--text-body-sm)", marginBottom: "var(--space-3)" }}
              >
                AI Activity
              </span>
              <div className="flex flex-col" style={{ gap: "var(--space-3)" }}>
                <ActivityItem
                  icon={<Bot className="w-3.5 h-3.5" />}
                  text="Screened 42 resumes"
                  time="2m ago"
                />
                <ActivityItem
                  icon={<Calendar className="w-3.5 h-3.5" />}
                  text="Scheduled 3 interviews"
                  time="15m ago"
                />
                <ActivityItem
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  text="Evaluated Sarah Chen"
                  time="1h ago"
                />
                <ActivityItem
                  icon={<Zap className="w-3.5 h-3.5" />}
                  text="Sent offer to James K."
                  time="3h ago"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   INTERNAL SUB-COMPONENTS — all sharp edges
   ───────────────────────────────────────────────── */

function SidebarItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center cursor-pointer transition-colors duration-150",
        active
          ? "bg-brand-subtle text-foreground font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      style={{
        padding: "8px 12px",
        gap: "var(--space-2)",
        fontSize: "var(--text-body-sm)",
      }}
    >
      <span className={active ? "text-[#5561c8]" : ""}>{icon}</span>
      {label}
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  positive,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
}) {
  return (
    <div
      className="border border-line bg-white"
      style={{ padding: "var(--space-3) var(--space-4)" }}
    >
      <span
        className="block text-muted-foreground"
        style={{ fontSize: "var(--text-micro)", marginBottom: "var(--space-1)" }}
      >
        {label}
      </span>
      <div className="flex items-baseline" style={{ gap: "var(--space-2)" }}>
        <span
          className="font-semibold text-foreground"
          style={{ fontSize: "var(--text-heading-sm)" }}
        >
          {value}
        </span>
        <span
          className="font-medium"
          style={{
            fontSize: "var(--text-micro)",
            color: positive ? "#22c55e" : "#ef4444",
          }}
        >
          {change}
        </span>
      </div>
    </div>
  );
}

function PipelineBar({
  label,
  width,
  color,
  value,
}: {
  label: string;
  width: string;
  color: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: "var(--space-1)" }}>
        <span className="text-muted-foreground" style={{ fontSize: "var(--text-micro)" }}>
          {label}
        </span>
        <span className="font-medium text-foreground" style={{ fontSize: "var(--text-micro)" }}>
          {value}
        </span>
      </div>
      <div className="w-full h-1.5 bg-muted overflow-hidden">
        <div
          className="h-full"
          style={{ width, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ActivityItem({
  icon,
  text,
  time,
}: {
  icon: React.ReactNode;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-center" style={{ gap: "var(--space-3)" }}>
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: "28px",
          height: "28px",
          background: "rgba(85, 97, 200, 0.08)",
          color: "#5561c8",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-foreground block truncate"
          style={{ fontSize: "var(--text-body-sm)" }}
        >
          {text}
        </span>
      </div>
      <span
        className="text-muted-foreground shrink-0"
        style={{ fontSize: "var(--text-micro)" }}
      >
        {time}
      </span>
    </div>
  );
}