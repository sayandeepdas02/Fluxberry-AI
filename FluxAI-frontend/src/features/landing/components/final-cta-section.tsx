// "use client";

// import { useEffect, useRef } from "react";
// import Link from "next/link";
// import { cn } from "@/lib/utils";
// import { ArrowRight } from "lucide-react";
// import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";
// import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

// /* ─────────────────────────────────────────────────
//    FINAL CTA SECTION — Chanhdai-style Editorial
//    Flat dark, sharp buttons, no gradient/glow
//    ───────────────────────────────────────────────── */
// export function FinalCTASection() {
//   const sectionRef = useRef<HTMLElement>(null);

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       (entries) => {
//         entries.forEach((entry) => {
//           if (entry.isIntersecting) {
//             entry.target.classList.add("visible");
//             observer.disconnect();
//           }
//         });
//       },
//       { rootMargin: "100px 0px" }
//     );

//     if (sectionRef.current) observer.observe(sectionRef.current);
//     return () => observer.disconnect();
//   }, []);

//   return (
//     <SectionWrapper 
//       ref={sectionRef}
//       id="cta" 
//       className="section-enter relative overflow-hidden py-[80px] md:py-[100px]"
//       style={{ backgroundColor: "#5B63C7" }}
//     >
//       {/* ── Interactive Grid Pattern Background ── */}
//       <div className="absolute inset-0 z-0">
//          <InteractiveGridPattern 
//            className={cn(
//              "[mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]",
//              "!absolute !inset-0 h-full w-full bg-transparent"
//            )}
//            glowColor="rgba(255, 255, 255, 0.25)"
//            borderColor="rgba(255, 255, 255, 0.1)"
//          />
//       </div>

//       {/* ── Content Container ── */}
//       <div className="mx-auto w-full relative z-10 flex flex-col items-center text-center px-4">
//         <h2
//           className="font-semibold tracking-tight text-white text-balance"
//           style={{
//             fontSize: "clamp(1.75rem, 4vw, 44px)",
//             lineHeight: "1.12",
//             letterSpacing: "-0.02em",
//             maxWidth: "720px",
//           }}
//         >
//           Let AI run your hiring{" "}
//           <span style={{ color: "rgba(255, 255, 255, 0.85)" }}>— while you focus on building your team</span>
//         </h2>

//         <p
//           className="font-normal"
//           style={{
//             color: "rgba(255, 255, 255, 0.85)",
//             fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
//             lineHeight: "1.6",
//             maxWidth: "600px",
//             marginTop: "var(--space-4)",
//           }}
//         >
//           Join modern teams using Fluxberry AI to hire faster and smarter.
//         </p>

//         {/* ── CTA Buttons — sharp rectangles ── */}
//         <div
//           className="flex flex-wrap items-center justify-center"
//           style={{
//             gap: "var(--space-3)",
//             marginTop: "var(--space-10)",
//           }}
//         >
//           {/* Primary CTA */}
//           <Link href="/signup">
//             <SharpButton
//               variant="primary"
//               className="!bg-white !text-[#3B429F] !border-white hover:!bg-white/90 font-semibold"
//               style={{ padding: "14px 28px", fontSize: "15px" }}
//             >
//               Start free trial
//               <ArrowRight className="w-4 h-4 ml-2" />
//             </SharpButton>
//           </Link>

//           {/* Secondary CTA */}
//           <Link href="/demo">
//             <button
//               className={cn(
//                 "cursor-pointer font-semibold",
//                 "border border-black bg-black text-white",
//                 "flex items-center",
//                 "hover:bg-black/90",
//                 "active:bg-black/80",
//                 "transition-all duration-200 ease-out rounded-none"
//               )}
//               style={{ padding: "13px 28px", fontSize: "15px" }}
//             >
//               Book a demo
//             </button>
//           </Link>
//         </div>
//       </div>
//     </SectionWrapper>
//   );
// }




























"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";
import { InteractiveGridPattern } from "@/components/ui/interactive-grid-pattern";

/* ─────────────────────────────────────────────────
   FINAL CTA SECTION — Chanhdai-style Editorial
   Flat dark, sharp buttons, no gradient/glow
   ───────────────────────────────────────────────── */
export function FinalCTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.disconnect();
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <SectionWrapper
      ref={sectionRef}
      id="cta"
      className="section-enter relative overflow-hidden py-[80px] md:py-[100px]"
      style={{ backgroundColor: "#5B63C7" }}
    >
      {/* ── Interactive Grid Pattern Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <InteractiveGridPattern
          className={cn(
            "[mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]",
            "!absolute !inset-0 h-full w-full bg-transparent"
          )}
          glowColor="rgba(255, 255, 255, 0.25)"
          borderColor="rgba(255, 255, 255, 0.1)"
        />
      </div>

      {/* ── Content Container ── */}
      <div className="mx-auto w-full relative z-10 flex flex-col items-center text-center px-4 pointer-events-none">
        <h2
          className="font-semibold tracking-tight text-white text-balance"
          style={{
            fontSize: "clamp(1.75rem, 4vw, 44px)",
            lineHeight: "1.12",
            letterSpacing: "-0.02em",
            maxWidth: "720px",
          }}
        >
          Let AI run your hiring{" "}
          <span style={{ color: "rgba(255, 255, 255, 0.85)" }}>
            — while you focus on building your team
          </span>
        </h2>

        <p
          className="font-normal"
          style={{
            color: "rgba(255, 255, 255, 0.85)",
            fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
            lineHeight: "1.6",
            maxWidth: "600px",
            marginTop: "var(--space-4)",
          }}
        >
          Join modern teams using Fluxberry AI to hire faster and smarter.
        </p>

        {/* ── CTA Buttons ── */}
        <div
          className="flex flex-wrap items-center justify-center"
          style={{
            gap: "var(--space-3)",
            marginTop: "var(--space-10)",
          }}
        >
          {/* Primary CTA */}
          <Link href="/signup" className="pointer-events-auto">
            <SharpButton
              variant="primary"
              className="!bg-white !text-[#3B429F] !border-white hover:!bg-white/90 font-semibold pointer-events-auto"
              style={{ padding: "14px 28px", fontSize: "15px" }}
            >
              Start free trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </SharpButton>
          </Link>

          {/* Secondary CTA */}
          <Link href="/demo" className="pointer-events-auto">
            <button
              className={cn(
                "pointer-events-auto cursor-pointer font-semibold",
                "border border-black bg-black text-white",
                "flex items-center",
                "hover:bg-black/90",
                "active:bg-black/80",
                "transition-all duration-200 ease-out rounded-none"
              )}
              style={{ padding: "13px 28px", fontSize: "15px" }}
            >
              Book a demo
            </button>
          </Link>
        </div>
      </div>
    </SectionWrapper>
  );
}