"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "IF I USE FLUXBERRY AI FOR HIRING, DO I NEED ANY OTHER TOOL?",
      answer: "Cypher helps teams design, build, and deploy practical AI solutions. We work across strategy, implementation, and optimization to ensure AI fits real business workflows and delivers measurable value."
    },
    {
      question: "HOW IS FLUXBERRY DIFFERENT FROM A TRADITIONAL ATS?",
      answer: "Cypher is built for startups, SMEs, and tech-forward teams looking to use AI in a reliable, production-ready way—without experimenting blindly or relying on one-off tools."
    },
    {
      question: "WHAT TYPES OF ASSESSMENTS ARE SUPPORTED?",
      answer: "We offer AI strategy, custom AI solutions, workflow automations, and system integrations. Each engagement is tailored to the client's goals, tools, and operational needs."
    },
    {
      question: "IS THIS SUITABLE FOR EARLY-STAGE STARTUPS?",
      answer: "Unlike traditional agencies, Cypher focuses exclusively on AI and automation. We combine technical depth with a business-first approach to deliver scalable, maintainable solutions—not just demos."
    },
    {
      question: "HOW LONG DOES SETUP TAKE?",
      answer: "Yes. Cypher designs AI solutions that integrate with your existing stack, including internal tools, APIs, databases, and third-party platforms."
    }
  ];

  return (
    <section className="relative w-full py-24 bg-[#FAFAFA]" id="faq">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 pb-32 border-b border-dashed border-[#ccc]">
          
          {/* LEFT COLUMN: Headings & CTA */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div className="sticky top-32">
               <h2 className="text-[#111] text-[52px] md:text-[68px] font-heading font-medium leading-[0.95] tracking-tighter mb-16 lg:mb-0">
                 Frequently <br />
                 asked <br />
                 <span className="text-[#888]">questions</span>
               </h2>

               <div className="hidden lg:block mt-auto pt-32">
                 <button className="bg-[#f64124] hover:bg-[#e2361a] text-white font-mono text-[11px] font-medium tracking-widest px-8 py-3.5 rounded-full flex items-center gap-2 transition-colors uppercase">
                   ASK A QUESTION <ArrowUpRight size={15} />
                 </button>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Desktop offset spacing */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* RIGHT COLUMN: Accordion List */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index}
                  className={`bg-[#F2F2F2] transition-all duration-300 ease-in-out cursor-pointer overflow-hidden ${
                    isOpen ? 'rounded-[24px]' : 'rounded-full'
                  }`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  {/* QUESTION ROW */}
                  <div className={`px-6 md:px-8 flex items-center justify-between ${isOpen ? 'pt-8 pb-4' : 'py-5'}`}>
                    <span className="font-mono text-[11px] md:text-[12px] tracking-widest uppercase text-[#333] font-medium leading-relaxed max-w-[85%]">
                      {faq.question}
                    </span>
                    
                    {/* SVG PLUS / CROSS TOGGLE */}
                    <div className="flex-shrink-0 ml-4 relative w-4 h-4 text-[#f64124]">
                       <div className={`absolute inset-0 transition-transform duration-300 ${isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
                         <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                       </div>
                       <div className={`absolute inset-0 transition-transform duration-300 ${isOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
                         <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                       </div>
                    </div>
                  </div>

                  {/* ANSWER BODY (Animated Dropdown) */}
                  <div 
                    className={`px-6 md:px-8 transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[300px] opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0'
                    }`}
                  >
                    <p className="text-[#666] text-[14px] leading-[1.6]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {/* MOBILE CTA */}
            <div className="block lg:hidden mt-8">
                <button className="bg-[#f64124] hover:bg-[#e2361a] text-white font-mono text-[11px] font-medium tracking-widest px-8 py-3.5 rounded-full flex items-center justify-center gap-2 transition-colors uppercase w-full">
                  ASK A QUESTION <ArrowUpRight size={15} />
                </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
