import { Panel, PanelContent } from "@/components/ui/panel";
import { Check, Paperclip, Github, Mic, ArrowUp } from "lucide-react";

export function Hero() {
  return (
    <Panel id="hero">
      <PanelContent className="py-20 md:py-24">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* LEFT SIDE */}
          <div className="lg:pr-10">
            {/* UPDATES PILL */}
            <div className="inline-flex items-center gap-3 bg-[#F2F2F2] rounded-full p-[5px] pr-4 mb-8 border border-black/5 shadow-sm">
              <div className="bg-[#f64124] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                UPDATES
              </div>
              <span className="text-[12px] font-medium text-black/90 flex items-center gap-1.5">
                Fluxberry AI v1.0 is open to public 
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-black/60"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </span>
            </div>

            <h1 className="font-heading text-5xl md:text-[76px] font-medium mb-6 leading-[0.93] tracking-[-0.04em] text-[#111]">
              AI Native Hiring <br />
              automation for <br />
              <span className="text-[#6B6B6B]">growing teams</span>
            </h1>

            <p className="text-[18px] text-[#555] mb-12 max-w-[480px] leading-[1.6]">
              Fluxberry AI turns fragmented hiring workflows into a single AI-native system — from sourcing candidates to onboarding them.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button className="flex items-center justify-center rounded-full bg-[#f64124] text-white font-mono text-[14px] leading-[20px] font-normal uppercase tracking-[0.05em] px-8 py-3.5 hover:bg-[#e2361a] transition shadow-md">
                BOOK A DEMO <span className="ml-[6px] text-[15px] font-sans stroke-current mt-px">↗</span>
              </button>

              <button className="flex items-center justify-center rounded-full bg-[#F2F2F2] text-[#222] font-mono text-[14px] leading-[20px] font-normal uppercase tracking-[0.05em] px-8 py-3.5 hover:bg-black/5 transition border border-black/5">
                LEARN MORE
              </button>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative w-full h-[600px] rounded-[32px] bg-gradient-to-bl from-[#180a05] via-[#751103] to-[#f96f1b] p-[32px] flex flex-col justify-between shadow-[0_20px_50px_-15px_rgba(249,111,27,0.3)] border border-black/5 overflow-hidden">
            
            {/* AMBIENT LIGHTING OVERLAYS (Optional, for richer glow) */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#ff842b]/20 to-transparent pointer-events-none" />

            {/* TAGS */}
            <div className="flex flex-col gap-[14px] items-start relative z-10 w-fit">
              {[
                "Automate everyday internal workflows",
                "Move tasks forward automatically",
                "Sync data across tools in real time",
                "Eliminate operational bottlenecks",
                "Maintain clear visibility across teams",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 bg-[#4F3C35]/50 backdrop-blur-md border border-white/5 rounded-[12px] px-4 py-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-center w-[18px] h-[18px] bg-white rounded-full text-[#DE3A1D] shrink-0">
                    <Check className="w-[11px] h-[11px] stroke-[4]" />
                  </div>
                  <span className="text-[13.5px] font-medium text-white/95 tracking-wide">{item}</span>
                </div>
              ))}
            </div>

            {/* CHAT BOX */}
            <div className="bg-gradient-to-br from-[#ffffff99] to-[#ffffff33] backdrop-blur-3xl rounded-[24px] p-[22px] pb-[18px] border-[1.5px] border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative z-10">
              <p className="text-[15px] font-medium text-[#222] mb-14 drop-shadow-sm">
                How will I manage end to end hiring on Fluxberry AI ?
              </p>

              <div className="flex items-center justify-between">
                {/* LEFT ICONS */}
                <div className="flex gap-2.5">
                  <button className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#2A2B2E] text-white/90 shadow-sm border border-white/10 hover:bg-[#1A1A1C] transition">
                    <Paperclip className="w-[18px] h-[18px]" />
                  </button>
                  <button className="flex items-center justify-center w-[38px] h-[38px] rounded-[10px] bg-[#2A2B2E] text-white/90 shadow-sm border border-white/10 hover:bg-[#1A1A1C] transition">
                    <Github className="w-[20px] h-[20px] fill-current" />
                  </button>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex gap-2.5">
                  <button className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#3D3A37] text-white/90 shadow-sm border border-white/10 hover:bg-[#2A2A28] transition">
                    <Mic className="w-[18px] h-[18px]" />
                  </button>
                  <button className="flex items-center justify-center w-[38px] h-[38px] rounded-full bg-[#f64124] text-white shadow-sm border border-white/10 hover:bg-[#e2361a] transition">
                    <ArrowUp className="w-[18px] h-[18px] stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </PanelContent>
    </Panel>
  );
}