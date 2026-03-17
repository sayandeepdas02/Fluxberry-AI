"use client";

import { ArrowUpRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="w-full py-24 md:py-32 bg-[#FAFAFA]" id="cta">
      <div className="max-w-[1000px] mx-auto px-4 flex flex-col items-center text-center">
        
        {/* HUGE TYPOGRAPHY HEADLINE */}
        <h2 className="text-[#111] text-[48px] md:text-[72px] lg:text-[84px] font-heading font-medium leading-[1.05] tracking-tight mb-6">
          Experience the{" "}
          <span className="inline-flex align-middle mx-2 -my-2 w-14 h-14 md:w-20 md:h-20 bg-[#222730] rotate-12 rounded-[16px] md:rounded-[24px] items-center justify-center shadow-lg">
            <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.13 15.57a9 9 0 0 0 16.59-1.34L21.5 8"/><path d="M2.5 22v-6h6M21.87 8.43a9 9 0 0 0-16.59 1.34L2.5 16"/></svg>
          </span>{" "}
          future of <br />
          hiring with{" "}
          <span className="inline-flex align-middle mx-2 -my-2 w-14 h-14 md:w-20 md:h-20 bg-[#f64124] -rotate-12 rounded-[16px] md:rounded-[24px] items-center justify-center shadow-lg relative">
             {/* Faux generic logo construction */}
             <div className="absolute w-[45%] h-[45%] border-[3.5px] border-white rounded-[6px]" />
             <div className="absolute w-2 h-2 bg-white rounded-sm -top-1" />
             <div className="absolute w-2 h-2 bg-white rounded-sm -bottom-1" />
             <div className="absolute w-2 h-2 bg-white rounded-sm -left-1" />
             <div className="absolute w-2 h-2 bg-white rounded-sm -right-1" />
          </span>{" "}
          Fluxberry AI
        </h2>

        {/* SUBHEADING TEXT */}
        <p className="text-[#666] text-[16px] md:text-[18px] mb-12 max-w-[600px]">
          Fluxberry AI helps you hire faster, cheaper with better decisions.
        </p>

        {/* CTA BUTTON */}
        <button className="bg-[#f64124] hover:bg-[#e2361a] text-white font-mono text-[12px] md:text-[13px] font-medium tracking-widest px-10 py-4 rounded-full flex items-center gap-2 transition-colors uppercase shadow-md hover:shadow-lg">
          GET STARTED <ArrowUpRight size={18} />
        </button>

      </div>
    </section>
  );
}
