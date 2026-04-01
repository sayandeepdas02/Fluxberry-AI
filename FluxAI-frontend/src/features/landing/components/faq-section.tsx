"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

/* ─────────────────────────────────────────────────
   FAQ SECTION — Chanhdai-style Editorial
   Sharp accordion, border-line dividers
   ───────────────────────────────────────────────── */

const faqs = [
  {
    question: "How does Fluxberry AI automate hiring?",
    answer: "Our intelligent agents handle everything from parsing resumes and screening parameters to automating calendar invites for interviews."
  },
  {
    question: "Can I integrate it with my existing ATS?",
    answer: "Yes, Fluxberry seamlessly integrates with major ATS platforms like Greenhouse, Workday, and Lever via our native API."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, we offer a 14-day free trial on our Starter plan so you can experience automated hiring with zero risk."
  },
  {
    question: "How secure is my data?",
    answer: "Fluxberry AI is SOC2 Type II compliant and uses enterprise-grade encryption to ensure your applicant data stays private and secure."
  },
  {
    question: "Can I customize workflows?",
    answer: "Absolutely. Our visual workflow builder allows you to customize exactly how and when AI interacts with your candidates."
  }
];

export function FAQSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const items = entry.target.querySelectorAll(".faq-item-enter");
            items.forEach((item, index) => {
              (item as HTMLElement).style.transitionDelay = `${index * 100}ms`;
              item.classList.add("visible");
            });
          }
        });
      },
      { rootMargin: "100px 0px" }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="section-enter relative w-full bg-background screen-line-top screen-line-bottom"
      style={{
        paddingTop: "clamp(64px, 8vw, var(--space-24))",
        paddingBottom: "clamp(64px, 8vw, var(--space-24))",
      }}
    >
      <div
        className="mx-auto"
        style={{
          paddingInline: "clamp(1rem, 3vw, 2rem)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* ═══ LEFT SIDE ═══ */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            <div
              className="inline-flex items-center font-medium"
              style={{
                padding: "4px 12px",
                gap: "6px",
                fontSize: "13px",
                color: "var(--primary)",
                background: "var(--primary-subtle)",
                border: "1px solid rgba(85, 97, 200, 0.15)",
                letterSpacing: "0.01em",
                marginBottom: "var(--space-4)",
              }}
            >
              <span>FAQ</span>
            </div>

            <h2
              className="font-semibold tracking-tight text-foreground text-balance"
              style={{
                fontSize: "clamp(1.75rem, 4vw, var(--text-display))",
                lineHeight: "1.12",
                maxWidth: "600px",
                letterSpacing: "-0.02em",
              }}
            >
              Frequently asked <span style={{ color: "var(--primary)" }}>questions</span>
            </h2>

            <p
              className="text-muted-foreground font-normal"
              style={{
                fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
                lineHeight: "1.6",
                maxWidth: "400px",
                marginTop: "var(--space-4)",
              }}
            >
              Everything you need to know before getting started.
            </p>
          </div>

          {/* ═══ RIGHT SIDE ═══ */}
          <div className="lg:col-span-7 flex flex-col border-t border-line">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>

        </div>
      </div>

      <style jsx global>{`
        .faq-item-enter {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 400ms ease-out, transform 400ms ease-out;
        }
        .faq-item-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────
   FAQ ITEM — clean accordion with border-line
   ───────────────────────────────────────────────── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="faq-item-enter border-b border-line group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-5 text-left focus:outline-none transition-colors group-hover:text-primary cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="text-base font-normal text-foreground transition-colors group-hover:text-primary pr-8">
          {question}
        </span>
        <Plus 
          className="w-4 h-4 shrink-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:text-primary"
          style={{ 
            transform: isOpen ? "rotate(45deg)" : "rotate(0)",
            color: "var(--primary)"
          }}
        />
      </button>
      
      <div
        ref={contentRef}
        className="overflow-hidden transition-[height,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ 
          height: isOpen ? `${contentRef.current?.scrollHeight}px` : "0px",
          opacity: isOpen ? 1 : 0
        }}
      >
        <div className="pb-6">
          <p className="text-muted-foreground text-base leading-relaxed max-w-[560px]">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
