"use client";

import Image from "next/image";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="w-full py-28 md:py-36 bg-[#FAFAFA] relative" id="cta">
      {/* Subtle top separator — dashed line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1280px] px-6 lg:px-8">
        <div className="border-t border-dashed border-black/[0.08]" />
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 flex flex-col items-center text-center">
        {/* ── HEADLINE WITH INLINE ICONS ── */}
        <h2 className="text-[#111] text-[40px] md:text-[60px] lg:text-[72px] font-sans font-medium leading-[1.1] tracking-[-0.03em] mb-6">
          Experience the{" "}
          <span className="inline-flex align-middle mx-1.5 w-[48px] h-[48px] md:w-[68px] md:h-[68px] lg:w-[80px] lg:h-[80px] -my-1">
            <Image
              src="/future-icon.png"
              alt=""
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </span>{" "}
          future of
          <br className="hidden md:block" />{" "}
          hiring with{" "}
          <span className="inline-flex align-middle mx-1.5 w-[48px] h-[48px] md:w-[68px] md:h-[68px] lg:w-[80px] lg:h-[80px] -my-1">
            <Image
              src="/tilted-logo.png"
              alt=""
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </span>{" "}
          Fluxberry AI
        </h2>

        {/* ── SUBHEADING ── */}
        <p className="text-[#777] text-[16px] md:text-[17px] font-sans leading-[1.6] mb-12 max-w-[500px]">
          Fluxberry AI helps you hire faster, cheaper with better decisions.
        </p>

        {/* ── CTA BUTTON ── */}
        <Link href="/demo">
          <button className="group bg-[#f64124] hover:bg-[#e53a1e] text-white font-mono text-[12px] font-medium tracking-[0.1em] uppercase px-9 py-4 rounded-full flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            Get Started
            <span className="text-[14px] leading-none transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
          </button>
        </Link>
      </div>
    </section>
  );
}
