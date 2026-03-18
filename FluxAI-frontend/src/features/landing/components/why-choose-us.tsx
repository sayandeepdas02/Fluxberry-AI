"use client";

import { ArrowRight } from "lucide-react";

export function WhyChooseUs() {
  return (
    <section className="relative bg-[#f64124] py-24 md:py-32 overflow-hidden w-full">
      {/* Decorative Background Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-white/[0.03] rounded-[100px] transform rotate-12 pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[800px] h-[800px] bg-white/[0.04] rounded-[120px] transform -rotate-12 pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-black/[0.03] rounded-[140px] transform rotate-45 pointer-events-none" />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-20">
          {/* Left Heading */}
          <h2 className="text-white text-[48px] md:text-[64px] font-heading font-medium tracking-tight leading-[1.05] max-w-[600px]">
            Fluxberry AI enables <br /> teams beyond hiring
          </h2>

          {/* Right Description */}
          <div className="flex flex-col items-start max-w-[420px] mt-2">
             <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full mb-6">
               <div className="w-2.5 h-2.5 rounded-full bg-[#f64124]" />
               <span className="text-[10px] font-mono tracking-wider font-bold text-[#f64124]">WHY FLUXBERRY AI</span>
             </div>
             <p className="text-white/95 text-[15px] font-sans font-normal leading-relaxed">
               From Talent Acquisition to Engineering Teams, Fluxberry AI improves productivity across the
               organisation, finding the best talent faster, reducing cost per hire and removing dependency on
               engineering bandwidth to hire tech talent
             </p>
          </div>
        </div>

        {/* METRICS BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 relative">
          
          {/* ROW 1 */}
          <div className="bg-[#EAEAEA] rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[280px] md:h-[320px] transition-transform hover:scale-[1.02]">
            <div className="text-[48px] md:text-[64px] font-heading font-medium tracking-tight text-[#222] leading-none">
              85%
            </div>
            <p className="text-[#555] text-[14px] font-sans font-normal leading-[1.6]">
              Fewer repetitive tasks for each team, freeing time for strategic work.
            </p>
          </div>

          <div className="bg-[#EAEAEA] rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[280px] md:h-[320px] transition-transform hover:scale-[1.02]">
            <div className="text-[48px] md:text-[64px] font-heading font-medium tracking-tight text-[#222] leading-none">
              10x
            </div>
            <p className="text-[#555] text-[14px] font-sans font-normal leading-[1.6]">
              Faster approval times across workflows, keeping projects moving smoothly.
            </p>
          </div>

          <div className="relative bg-[#EAEAEA] rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[280px] md:h-[320px] transition-transform hover:scale-[1.02]">
            <div className="text-[48px] md:text-[64px] font-heading font-medium tracking-tight text-[#222] leading-none">
              $120K+
            </div>
            <p className="text-[#555] text-[14px] font-sans font-normal leading-[1.6]">
              Saved annually by automating internal processes.
            </p>

            {/* INTERSECTING LOGO BETWEEN CARDS 3, 4, 5, 6 */}
            <div 
              className="hidden lg:flex absolute z-20 w-[48px] h-[48px] bg-[#222] rounded-full items-center justify-center border-[6px] border-[#f64124]"
              style={{ right: '-32px', bottom: '-32px' }}
            >
               <svg width="20" height="20" viewBox="5 5 22 22" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"><path d="M 24 8 L 14 8 A 6 6 0 0 0 8 14 L 8 18 A 6 6 0 0 0 14 24 L 24 24" /></svg>
            </div>
          </div>

          <div className="bg-[#EAEAEA] rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[280px] md:h-[320px] transition-transform hover:scale-[1.02]">
            <div className="text-[48px] md:text-[64px] font-heading font-medium tracking-tight text-[#222] leading-none">
              25%
            </div>
            <p className="text-[#555] text-[14px] font-sans font-normal leading-[1.6]">
              More time spent on high-impact work instead of manual busywork.
            </p>
          </div>

          {/* ROW 2 */}
          <div className="lg:col-span-2 flex flex-col justify-center lg:justify-end p-4 md:p-8 h-auto lg:h-[320px]">
             <div className="max-w-[280px] lg:mb-8">
               <p className="text-white text-[18px] md:text-[20px] font-sans font-normal leading-[1.4] mb-6">
                 See how your team can get the same results with Fluxberry AI
               </p>
               <button className="bg-[#222] text-white font-mono text-[12px] md:text-[13px] tracking-wider px-8 py-4 rounded-full hover:bg-black transition-colors flex items-center gap-3">
                 BOOK A DEMO <ArrowRight size={16} />
               </button>
             </div>
          </div>

          <div className="bg-[#EAEAEA] rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[280px] md:h-[320px] transition-transform hover:scale-[1.02]">
            <div className="text-[48px] md:text-[64px] font-heading font-medium tracking-tight text-[#222] leading-none">
              15x
            </div>
            <p className="text-[#555] text-[14px] font-sans font-normal leading-[1.6]">
              Reduction in manual data entry errors, improving accuracy and reliability.
            </p>
          </div>

          <div className="bg-[#EAEAEA] rounded-[24px] p-6 md:p-8 flex flex-col justify-between h-[280px] md:h-[320px] transition-transform hover:scale-[1.02]">
            <div className="text-[48px] md:text-[64px] font-heading font-medium tracking-tight text-[#222] leading-none">
              3x
            </div>
            <p className="text-[#555] text-[14px] font-sans font-normal leading-[1.6]">
              Increase in cross-team collaboration efficiency across departments.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
}
