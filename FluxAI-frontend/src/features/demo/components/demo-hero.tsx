"use client";

import { Check } from "lucide-react";
import { SHINE_CLASSES } from "@/components/shared/layout-primitives";
import { CalEmbed } from "./cal-embed";

function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center shrink-0 w-5 h-5 border border-line bg-muted/50 rounded-sm">
        <Check className="w-3.5 h-3.5 text-foreground" />
      </div>
      <span className="text-[14px] text-muted-foreground font-medium">
        {children}
      </span>
    </div>
  );
}

export function DemoHero() {
  return (
    <section className="relative w-full bg-background screen-line-bottom">
      <div className="mx-auto flex flex-col md:flex-row w-full max-w-[1200px] border-x border-line relative z-10">

        {/* ── LEFT: Typography & Copy ── */}
        <div
          className="flex-1 border-r border-line"
          style={{ padding: "clamp(64px, 8vw, var(--space-20)) clamp(24px, 4vw, var(--space-12))" }}
        >
          <div className="max-w-[480px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 border border-line bg-muted/20 px-3 py-1 mb-8 rounded-none">
              <span className="w-1.5 h-1.5 bg-brand rounded-full shrink-0" />
              <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                Book a Demo
              </span>
            </div>

            {/* Heading */}
            <h1
              className="tracking-tight text-foreground text-balance"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                lineHeight: "1.05",
                letterSpacing: "-0.03em",
              }}
            >
              See Fluxberry AI in action.
            </h1>

            {/* Subtitle */}
            <p className="text-[16px] text-muted-foreground leading-[1.6] max-w-[380px] mt-6">
              Discover how we automate your internal workflows and completely remove the operational overhead that slows teams down.
            </p>

            {/* ── Benefits grid ── */}
            <div className="mt-12 pt-12 border-t border-line">
              <span className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-6">
                What to expect
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                <BenefitItem>Product walkthrough</BenefitItem>
                <BenefitItem>Real examples</BenefitItem>
                <BenefitItem>Questions answered</BenefitItem>
                <BenefitItem>No obligations</BenefitItem>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Cal.com Embed ── */}
        <div
          className="w-full md:w-[580px] shrink-0 bg-muted/10 relative overflow-hidden"
          style={{ padding: "clamp(32px, 5vw, var(--space-16)) clamp(16px, 3vw, var(--space-8))" }}
        >
          {/* Subtle background overlay */}
          <div
            className="absolute top-0 right-0 w-32 h-32 bg-line opacity-20 pointer-events-none"
            style={{ maskImage: "radial-gradient(circle, black, transparent)" }}
          />

          {/* Calendar container — styled to match the existing card aesthetic */}
          <div
            className={`relative bg-background border border-line overflow-hidden animate-in fade-in duration-700 ${SHINE_CLASSES}`}
            style={{ borderRadius: 0 }}
          >
            <CalEmbed />
          </div>
        </div>
      </div>
    </section>
  );
}
