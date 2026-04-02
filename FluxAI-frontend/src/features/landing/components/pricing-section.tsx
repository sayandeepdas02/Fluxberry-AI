"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CreditCard } from "lucide-react";
import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";

/* ─────────────────────────────────────────────────
   PRICING SECTION — Chanhdai-style Editorial
   Sharp cards, no pills, no shadows, border-grid
   ───────────────────────────────────────────────── */
export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            const cards = entry.target.querySelectorAll(".pricing-card-enter");
            cards.forEach((card, index) => {
              (card as HTMLElement).style.transitionDelay = `${index * 150}ms`;
              card.classList.add("visible");
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
    <SectionWrapper ref={sectionRef} id="pricing" className="section-enter">
      <div className="w-full relative">
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col items-center justify-center text-center">
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
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pricing plans</span>
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
            Simple, <span style={{ color: "var(--primary)" }}>transparent pricing</span>
          </h2>

          <p
            className="text-muted-foreground font-normal"
            style={{
              fontSize: "clamp(1rem, 2vw, var(--text-body-lg))",
              lineHeight: "1.6",
              maxWidth: "600px",
              marginTop: "var(--space-4)",
            }}
          >
            Choose a plan that scales with your hiring needs.
          </p>

          {/* ── BILLING TOGGLE — sharp, no pills ── */}
          <div className="flex items-center gap-4 mt-8">
            <span
              className={cn(
                "text-sm font-medium transition-colors",
                !isYearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative w-12 h-6 transition-colors border outline-none focus:ring-2 focus:ring-primary/20",
                isYearly ? "bg-primary border-primary" : "bg-muted border-line"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 bg-white transition-transform duration-300",
                  isYearly ? "translate-x-6" : "translate-x-0"
                )}
              />
            </button>
            <span
              className={cn(
                "text-sm font-medium transition-colors flex items-center gap-1.5",
                isYearly ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Yearly
              <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        {/* ═══ PRICING GRID — shared border grid ═══ */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 mx-auto"
          style={{
            marginTop: "var(--space-12)",
            maxWidth: "1080px",
            alignItems: "stretch",
          }}
        >
          <PricingCard
            name="Starter"
            description="For small teams / early-stage startups"
            price={isYearly ? "0" : "0"}
            features={[
              "5 active job postings",
              "Standard AI screening",
              "Basic email scheduling",
              "Community support",
            ]}
            ctaText="Start free trial"
            ctaType="secondary"
          />

          <PricingCard
            name="Growth"
            description="Unlock advanced automation for growing teams"
            price={isYearly ? "119" : "149"}
            features={[
              "Unlimited job postings",
              "Advanced AI evaluation & scoring",
              "Automated calendar workflows",
              "Priority 24/7 support",
              "Custom ATS integrations",
            ]}
            ctaText="Get started"
            ctaType="primary"
            isPopular
          />

          <PricingCard
            name="Enterprise"
            description="Custom solutions for large-scale operations"
            price="Custom"
            features={[
              "Everything in Growth",
              "Custom AI training models",
              "Dedicated account manager",
              "SSO & advanced security (SOC2)",
              "White-glove onboarding",
            ]}
            ctaText="Contact sales"
            ctaType="secondary"
          />
        </div>
      </div>

      <style jsx global>{`
        .pricing-card-enter {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 400ms ease-out, transform 400ms ease-out;
        }
        .pricing-card-enter.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </SectionWrapper>
  );
}

/* ─────────────────────────────────────────────────
   PRICING CARD — Sharp edges, grid cell borders
   ───────────────────────────────────────────────── */
function PricingCard({
  name,
  description,
  price,
  features,
  ctaText,
  ctaType,
  isPopular,
}: {
  name: string;
  description: string;
  price: string;
  features: string[];
  ctaText: string;
  ctaType: "primary" | "secondary";
  isPopular?: boolean;
}) {
  return (
    <div
      className={cn(
        "pricing-card-enter relative flex flex-col bg-background transition-colors duration-300 ease-out group",
        "border border-line -mt-px md:mt-0 md:-ml-px first:ml-0 first:mt-0",
        isPopular && "bg-muted/30",
        !isPopular && "hover:bg-muted/30"
      )}
      style={{
        padding: "var(--space-8)",
        borderColor: isPopular ? "var(--primary)" : undefined,
        borderWidth: isPopular ? "2px" : undefined,
      }}
    >
      {/* Popular Badge — rectangular */}
      {isPopular && (
        <div className="inline-flex self-start bg-primary/10 text-primary text-xs font-semibold px-3 py-1 uppercase tracking-wide mb-4">
          Most Popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground tracking-tight mb-2">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm" style={{ minHeight: "2.5rem" }}>
          {description}
        </p>
      </div>

      {/* Price */}
      <div className="mb-8">
        <div className="flex items-baseline gap-1 transition-all duration-300">
          {price === "Custom" ? (
            <span className="text-4xl tracking-tight text-foreground">
              Custom
            </span>
          ) : (
            <>
              <span className="text-4xl tracking-tight text-foreground">
                ${price}
              </span>
              <span className="text-muted-foreground text-sm font-medium">/month</span>
            </>
          )}
        </div>
      </div>

      {/* CTA Button — sharp rectangular */}
      <SharpButton
        variant={ctaType === "primary" ? "primary" : "outline"}
        className="w-full mb-8"
      >
        {ctaText}
      </SharpButton>

      {/* Features List */}
      <div className="flex flex-col flex-1" style={{ gap: "var(--space-4)" }}>
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0 w-5 h-5 bg-primary/10 flex items-center justify-center">
              <Check className="w-3 h-3 text-primary" strokeWidth={3} />
            </div>
            <span className="text-sm text-foreground leading-snug">
              {feature}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
