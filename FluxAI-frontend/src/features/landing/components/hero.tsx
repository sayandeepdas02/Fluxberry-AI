import { Check, Paperclip, Github, Mic, ArrowUp } from "lucide-react";

/* ─────────────────────────────────────────────
   FEATURE TAG PILL (reusable)
   ───────────────────────────────────────────── */
function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-md border border-white/[0.08] rounded-full px-4 py-2.5">
      <span className="flex items-center justify-center w-[20px] h-[20px] bg-[#f64124] rounded-full shrink-0">
        <Check className="w-[11px] h-[11px] text-white stroke-[3]" />
      </span>
      <span className="text-[13px] font-sans text-white/90 leading-none">{children}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO SECTION
   ───────────────────────────────────────────── */
export function Hero() {
  return (
    <section id="hero" className="w-full pt-12 md:pt-20 pb-20 bg-[#FAFAFA]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col justify-between lg:min-h-[620px] pt-4">

            {/* Updates Badge */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#F2F2F2] rounded-full p-1 pr-3.5 mb-10 border border-black/[0.04]">
                <span className="bg-[#f64124] text-white text-[11px] font-sans font-medium px-2.5 py-[3px] rounded-full uppercase tracking-wide">
                  Updates
                </span>
                <span className="text-[12.5px] font-sans text-black/70 flex items-center gap-1.5">
                  Fluxberry AI v1.0 is open to public
                  <span className="text-[14px] text-black/40">→</span>
                </span>
              </div>

              {/* Heading */}
              <h1 className="font-sans text-[52px] md:text-[68px] lg:text-[76px] font-medium leading-[0.92] tracking-[-0.035em] mb-7">
                <span className="text-[#111] block">AI Native Hiring</span>
                <span className="text-[#111] block">automation for</span>
                <span className="text-[#9A9A9A] block">growing teams</span>
              </h1>

              {/* Description */}
              <p className="font-sans text-[16px] md:text-[17px] text-black/50 leading-[1.6] max-w-[440px] mb-14">
                Fluxberry AI turns fragmented hiring workflows into a single{" "}
                AI-native system — from sourcing candidates to onboarding them.
              </p>
            </div>

            {/* CTA Buttons (pinned to bottom on desktop) */}
            <div className="flex flex-wrap items-center gap-3">
              <button className="h-[52px] px-8 rounded-full bg-[#f64124] text-white font-mono text-[13px] font-medium uppercase tracking-[0.08em] flex items-center gap-2 hover:bg-[#e53a1e] transition-colors duration-200 cursor-pointer shadow-sm">
                Book a Demo
                <span className="text-[15px] leading-none">↗</span>
              </button>

              <button className="h-[52px] px-8 rounded-full bg-[#F0F0F0] text-black/80 font-mono text-[13px] font-medium uppercase tracking-[0.08em] flex items-center hover:bg-[#E5E5E5] transition-colors duration-200 border border-black/[0.04] cursor-pointer">
                Learn More
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN — GRADIENT CARD ── */}
          <div className="relative w-full min-h-[560px] lg:min-h-[620px] rounded-[28px] overflow-hidden flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.15)]">

            {/* Background gradient layers */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2C1610] via-[#5C2215] to-[#E8854A]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,_#3D1A0F_0%,_transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_100%,_#F5A665_0%,_transparent_60%)] opacity-60" />

            {/* ── TAG PILLS ── */}
            <div className="relative z-10 flex flex-col gap-2.5 p-7 pt-8">
              <div className="flex flex-wrap gap-2.5">
                <TagPill>Automate everyday internal workflows</TagPill>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <TagPill>Move tasks forward automatically</TagPill>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <TagPill>Sync data across tools in real time</TagPill>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <TagPill>Eliminate operational bottlenecks</TagPill>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <TagPill>Maintain clear visibility across teams</TagPill>
              </div>
            </div>

            {/* ── CHAT BOX ── */}
            <div className="relative z-10 mx-5 mb-5">
              <div className="rounded-[20px] overflow-hidden border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
                {/* Chat body — warm gradient */}
                <div className="bg-gradient-to-br from-[#FCEADC] via-[#F8D4B0] to-[#F0A76A] p-6 pb-5">
                  <p className="text-[14px] md:text-[15px] font-sans text-[#333] mb-16 leading-relaxed">
                    How will I manage end to end hiring on Fluxberry AI ?
                  </p>

                  {/* Bottom controls */}
                  <div className="flex items-center justify-between">
                    {/* Left icons */}
                    <div className="flex gap-2">
                      <button className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#222] text-white hover:bg-[#333] transition-colors cursor-pointer">
                        <Paperclip className="w-[15px] h-[15px]" />
                      </button>
                      <button className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#222] text-white hover:bg-[#333] transition-colors cursor-pointer">
                        <Github className="w-[16px] h-[16px]" />
                      </button>
                    </div>

                    {/* Right icons */}
                    <div className="flex gap-2">
                      <button className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#222] text-white hover:bg-[#333] transition-colors cursor-pointer">
                        <Mic className="w-[15px] h-[15px]" />
                      </button>
                      <button className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-[#f64124] text-white hover:bg-[#e53a1e] transition-colors cursor-pointer shadow-sm">
                        <ArrowUp className="w-[15px] h-[15px] stroke-[2.5]" />
                      </button>
                    </div>
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