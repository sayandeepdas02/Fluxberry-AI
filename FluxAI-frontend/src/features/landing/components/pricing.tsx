"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const cards = [
    {
      id: "starter",
      tag: "STARTER",
      description: "For early-stage teams setting up structured hiring",
      price: isAnnual ? "$79" : "$99",
      period: "/MONTH",
      buttonText: "CHOOSE STARTER",
      buttonColor: "bg-[#f64124] hover:bg-[#e2361a] text-white",
      features: [
        "Data updates & task automation",
        "Basic workflow routing",
        "Core tool integrations",
        "Activity logs & visibility",
        "Simple setup, no code"
      ]
    },
    {
      id: "growth",
      tag: "GROWTH",
      popular: true,
      description: "For scaling teams optimizing hiring speed and quality",
      price: isAnnual ? "$229" : "$299",
      period: "/MONTH",
      buttonText: "CHOOSE GROWTH",
      buttonColor: "bg-[#292D32] hover:bg-[#1a1c1f] text-white",
      features: [
        "Everything in Starter",
        "Smart workflow automation",
        "AI-based task prioritization",
        "Workflow analytics & insights",
        "Priority support"
      ]
    },
    {
      id: "scale",
      tag: "SCALE",
      description: "For high-growth companies building a hiring engine",
      price: "Custom",
      period: "",
      buttonText: "TALK TO SALES",
      buttonColor: "bg-[#f64124] hover:bg-[#e2361a] text-white",
      features: [
        "Everything in Growth",
        "End-to-end AI system design",
        "Unlimited integrations",
        "Real-time data syncronization",
        "Dedicated support & advisory"
      ]
    }
  ];

  return (
    <section className="relative w-full py-24 bg-[#f8f8f8]" id="pricing">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16">
          <div className="max-w-[640px]">
             {/* PRICING BADGE */}
             <div className="flex items-center gap-2 bg-[#EBEBEB] w-fit px-3 py-1.5 rounded-full mb-8">
               <div className="w-2.5 h-2.5 rounded-full bg-[#f64124]" />
               <span className="text-[10px] font-mono tracking-wider font-bold text-black/60 uppercase">PRICING</span>
             </div>
             
             {/* MAIN HEADLINE */}
             <h2 className="text-[#111] text-[48px] md:text-[68px] font-heading font-medium leading-[1.05] tracking-tight">
               Invest in efficiency<br />
               and <span className="text-[#888]">meaningful</span><br />
               <span className="text-[#888]">outcomes</span>
             </h2>
          </div>

          {/* TOGGLE SWITCH UI */}
          <div className="bg-[#EBEBEB] rounded-full p-1.5 flex items-center mb-4 md:mb-6 shadow-inner relative">
             <button 
               onClick={() => setIsAnnual(false)}
               className={`font-mono text-[11px] font-medium tracking-wider px-8 py-3 rounded-full transition-all duration-300 z-10 ${!isAnnual ? 'bg-white text-black shadow-sm' : 'text-[#888] hover:text-black'}`}
             >
               MONTHLY
             </button>
             <button 
               onClick={() => setIsAnnual(true)}
               className={`font-mono text-[11px] font-medium tracking-wider px-8 py-3 rounded-full transition-all duration-300 z-10 ${isAnnual ? 'bg-white text-black shadow-sm' : 'text-[#888] hover:text-black'}`}
             >
               ANNUAL
             </button>
          </div>
        </div>

        {/* PRICING GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          
          {cards.map((card, index) => (
            <div 
              key={card.id} 
              className="relative bg-[#EFEFEF] rounded-[24px] p-8 lg:p-10 flex flex-col border border-black/[0.03]"
            >
              
              {/* POPULAR BADGE */}
              {card.popular && (
                <div className="absolute top-0 right-8 bg-[#f64124] text-white text-[10px] font-mono font-bold tracking-wider px-4 py-2 rounded-b-lg uppercase z-10 shadow-sm">
                  POPULAR
                </div>
              )}

              {/* TIER TAG */}
              <div className="flex items-center gap-2 bg-white w-fit px-3 py-1 rounded-full mb-6">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#f64124]" />
                 <span className="text-[9px] font-mono tracking-wider font-bold text-[#666] uppercase">{card.tag}</span>
              </div>

              {/* TIER DESCRIPTION */}
              <p className="text-[#555] text-[15px] leading-relaxed mb-12 min-h-[44px]">
                {card.description}
              </p>

              {/* PRICE BLOCK */}
              <div className="flex items-baseline gap-1 mb-8">
                 <span className="text-[#111] text-[64px] lg:text-[72px] font-heading font-medium tracking-tighter leading-none">
                   {card.price}
                 </span>
                 {card.period && (
                   <span className="text-[#888] font-mono text-[10px] font-bold tracking-widest pl-2">
                     {card.period}
                   </span>
                 )}
              </div>

              {/* CTA BUTTON */}
              <button className={`w-full ${card.buttonColor} font-mono text-[12px] font-medium tracking-widest py-4 rounded-full flex items-center justify-center gap-2 transition-colors mb-12 uppercase`}>
                {card.buttonText} 
                <ArrowUpRight size={16} />
              </button>

              {/* FEATURE LIST */}
              <div className="flex flex-col flex-1">
                {card.features.map((feature, i) => (
                  <div 
                    key={i} 
                    className="flex items-center gap-4 py-4 border-b border-dashed border-[#ccc] last:border-b-0"
                  >
                     <DualCheckmark />
                     <span className="text-[#555] text-[14px]">
                       {feature}
                     </span>
                  </div>
                ))}
              </div>

            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

// Custom Dual Checkmark SVG mirroring the Figma design precisely
function DualCheckmark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <path 
        d="M2.5 13L7 17.5L16 8.5" 
        stroke="#f64124" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M10 17.5L14 21.5L23 12.5" 
        stroke="#f64124" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
