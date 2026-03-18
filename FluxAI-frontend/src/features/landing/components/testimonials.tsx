"use client";

import { ScanFace } from "lucide-react"; // Generic fallback for logos

export function Testimonials() {
  return (
    <section className="relative w-full py-24 bg-[#FAFAFA]" id="testimonials">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-16">
          <h2 className="text-[#111] text-[48px] md:text-[64px] font-heading font-medium leading-[1] tracking-tight max-w-[500px]">
            Discover stories <br />
            from teams <span className="text-[#888]">who<br />trust Fluxberry AI</span>
          </h2>

          <div className="flex flex-col items-start lg:items-end max-w-[320px] lg:text-right lg:pt-4">
             <div className="flex items-center gap-2 bg-[#EBEBEB] px-3 py-1.5 rounded-full mb-4">
               <div className="w-2.5 h-2.5 rounded-full bg-[#f64124]" />
               <span className="text-[10px] font-mono tracking-wider font-bold text-black/60 uppercase">TESTIMONIALS</span>
             </div>
             <p className="text-[#666] text-[15px] leading-relaxed">
               Trusted by startups and growing teams, Fluxberry AI helps companies design and implement AI solutions that integrate with real workflows and deliver dependable results.
             </p>
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[420px]">
          
          {/* TOP ROW */}
          
          {/* Image 1: 45 Degrees */}
          <div className="relative rounded-[24px] overflow-hidden bg-[#E2E8F0] lg:col-span-1 group">
            {/* Dark red/orange aesthetic gradient pretending to be an image */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#D04029] via-[#8D3B3B] to-[#3B4C5F]" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center gap-2 text-white font-medium">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg>
               <span>45 Degrees°</span>
            </div>
          </div>

          {/* Image 2: Elasticware */}
          <div className="relative rounded-[24px] overflow-hidden bg-[#CBD5E1] lg:col-span-1 group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#D04029] via-[#5F3B66] to-[#1E2530]" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 text-white font-bold text-lg">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2L9 9H2L7.5 13.5L5 21L12 16.5L19 21L16.5 13.5L22 9H15L12 2Z"/></svg>
               <span>Elasticware</span>
            </div>
          </div>

          {/* Quote 1: Daniel Foster (Boltshift) */}
          <div className="relative rounded-[24px] bg-[#F1F1F1] p-10 lg:col-span-2 flex flex-col justify-between overflow-hidden">
            {/* Background SVG Quotes */}
            <div className="absolute -bottom-8 -right-4 opacity-5 text-[#E0E0E0]">
              <HugeQuote />
            </div>
            <div className="absolute top-24 left-8 opacity-[0.03] text-[#E0E0E0]">
              <HugeQuote />
            </div>

            <div className="flex justify-between items-start relative z-10 w-full mb-12">
               <div>
                 <div className="font-semibold text-[#111] text-[15px]">Daniel Foster</div>
                 <div className="font-mono text-[10px] text-[#888] tracking-widest mt-1 uppercase">VP OF GROWTH, BOLTSHIFT</div>
               </div>
               <div className="flex items-center gap-2 font-bold text-xl text-black">
                 <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white p-1.5"><ScanFace size={18}/></div>
                 Boltshift
               </div>
            </div>

            <p className="relative z-10 text-[22px] md:text-[25px] leading-[1.35] text-[#111] font-medium tracking-tight">
              "Cypher became the connective layer between our tools. Instead of jumping between systems or fixing broken workflows, everything stays in sync automatically. Our team now spends far less time managing operations and more time executing on growth initiatives."
            </p>
          </div>

          {/* BOTTOM ROW */}

          {/* Quote 2: Sophie Nguyen (ennLabs) */}
          <div className="relative rounded-[24px] bg-[#F1F1F1] p-10 lg:col-span-2 flex flex-col justify-between overflow-hidden">
             <div className="absolute -bottom-8 -right-4 opacity-5 text-[#E0E0E0]">
              <HugeQuote />
            </div>
            <div className="absolute top-24 left-8 opacity-[0.03] text-[#E0E0E0]">
              <HugeQuote />
            </div>

            <div className="flex justify-between items-start relative z-10 w-full mb-12">
               <div>
                 <div className="font-semibold text-[#111] text-[15px]">Sophie Nguyen</div>
                 <div className="font-mono text-[10px] text-[#888] tracking-widest mt-1 uppercase">PRODUCT LEAD, ENNLABS</div>
               </div>
               <div className="flex items-center gap-2 font-bold text-xl text-black">
                 <div className="grid grid-cols-3 gap-1 w-6 h-6">
                    {[...Array(9)].map((_, i) => <div key={i} className="bg-black rounded-full w-full h-full" />)}
                 </div>
                 ennLabs
               </div>
            </div>

            <p className="relative z-10 text-[22px] md:text-[25px] leading-[1.35] text-[#111] font-medium tracking-tight">
              "What surprised us most was how quickly Cypher delivered value. Within the first week, we had multiple workflows running smoothly with minimal setup. The platform gave us better visibility into our operations while removing a lot of repetitive work from our day-to-day."
            </p>
          </div>

          {/* Image 3: Chromatools */}
          <div className="relative rounded-[24px] overflow-hidden bg-[#94A3B8] lg:col-span-1 group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#B02F1A] via-[#5D322B] to-[#7B8B9B]" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 text-white font-bold text-lg">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93L19.07 19.07M2 12H22M12 2V22"/></svg>
               <span>Chromatools</span>
            </div>
          </div>

          {/* Image 4: Fourpoints */}
          <div className="relative rounded-[24px] overflow-hidden bg-[#F87171] lg:col-span-1 group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#F64124] via-[#DE9F9F] to-[#737C88]" />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-center gap-2 text-white font-bold text-lg">
               <div className="grid grid-cols-2 gap-1 w-5 h-5">
                    {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-full w-full h-full" />)}
                 </div>
               <span>Fourpoints</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// Custom giant aesthetic SVG quote marks
function HugeQuote() {
  return (
    <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 11.2C10 8.053 11.533 5.426 14.6 3.32L15.666 4.92C13.8 6.413 12.866 7.96 12.866 9.56V11.2H16V18.666H10V11.2ZM18 11.2C18 8.053 19.533 5.426 22.6 3.32L23.666 4.92C21.8 6.413 20.866 7.96 20.866 9.56V11.2H24V18.666H18V11.2Z" />
    </svg>
  );
}
