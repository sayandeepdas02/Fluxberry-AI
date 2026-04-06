"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, CreditCard, ArrowUpRight } from "lucide-react";
import { SectionWrapper, SharpButton } from "@/components/shared/layout-primitives";
import { PRICING_PLANS, formatPrice } from "@/features/pricing/pricing-plans";

/* ─────────────────────────────────────────────────
   Gradient definitions for each pricing tier header
   Inspired by user-provided gradient images
   ───────────────────────────────────────────────── */
const HEADER_GRADIENTS: Record<string, string> = {
  free: "radial-gradient(ellipse at 25% 15%, #6B9FF5 0%, transparent 50%), radial-gradient(ellipse at 75% 30%, #E8352E 0%, transparent 55%), radial-gradient(ellipse at 60% 85%, #F07030 0%, transparent 50%), linear-gradient(135deg, #7EA8F0, #D04050, #E87050, #B03580)",
  starter: "radial-gradient(ellipse at 30% 25%, #8830D0 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #F070B0 0%, transparent 50%), linear-gradient(160deg, #7B30C8, #A850D0, #D070C0, #F090D0)",
  growth: "radial-gradient(ellipse at 20% 20%, #7070F8 0%, transparent 50%), radial-gradient(ellipse at 85% 85%, #F06040 0%, transparent 50%), linear-gradient(135deg, #6858E8, #8070F0, #A060C0, #E86848)",
  enterprise: "radial-gradient(ellipse at 50% 50%, #C890B8 0%, transparent 45%), radial-gradient(ellipse at 80% 80%, #E06040 0%, transparent 40%), linear-gradient(160deg, #384098, #4050A8, #5060B0, #3A3A78)",
};

/* ─────────────────────────────────────────────────
   PRICING SECTION — Clean, structured, productized
   Sharp edges, border-grid, consistent with landing page
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

          {/* ── BILLING TOGGLE ── */}
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mx-auto"
          style={{
            marginTop: "var(--space-12)",
            maxWidth: "1280px",
            alignItems: "stretch",
          }}
        >
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              planId={plan.id}
              name={plan.name}
              price={formatPrice(plan, isYearly).replace("$", "")}
              features={plan.features}
              ctaText={plan.cta}
              isPopular={plan.highlighted}
              aiTag={plan.aiTag}
              inheritsFrom={plan.inheritsFrom}
            />
          ))}
        </div>
      </div>

      {/* SVG noise filter for gradient grain texture */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <filter id="pricing-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>
      </svg>

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

        /* Gradient header box hover behavior */
        .pricing-header-box {
          position: relative;
          overflow: hidden;
        }
        .pricing-header-gradient {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 0;
        }
        .pricing-header-noise {
          position: absolute;
          inset: 0;
          opacity: 0;
          background: rgba(255,255,255,0.08);
          filter: url(#pricing-noise);
          mix-blend-mode: overlay;
          transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
        }
        .pricing-header-content {
          position: relative;
          z-index: 2;
        }

        /* On card hover → reveal gradient */
        .pricing-card-hover:hover .pricing-header-gradient {
          opacity: 1;
        }
        .pricing-card-hover:hover .pricing-header-noise {
          opacity: 1;
        }
        .pricing-card-hover:hover .pricing-header-text {
          color: #ffffff !important;
        }
        .pricing-card-hover:hover .pricing-header-subtext {
          color: rgba(255,255,255,0.6) !important;
        }
        .pricing-card-hover:hover .pricing-header-badge {
          border-color: rgba(255,255,255,0.3) !important;
          color: rgba(255,255,255,0.85) !important;
        }
      `}</style>
    </SectionWrapper>
  );
}

/* ─────────────────────────────────────────────────
   PRICING CARD — Sharp edges, border-grid cells
   Header box → CTA → Features → Footer
   ───────────────────────────────────────────────── */
function PricingCard({
  planId,
  name,
  price,
  features,
  ctaText,
  isPopular,
  aiTag,
  inheritsFrom,
}: {
  planId: string;
  name: string;
  price: string;
  features: string[];
  ctaText: string;
  isPopular?: boolean;
  aiTag: string;
  inheritsFrom?: string;
}) {
  const gradient = HEADER_GRADIENTS[planId] || HEADER_GRADIENTS.free;

  return (
    <div
      className={cn(
        "pricing-card-enter pricing-card-hover relative flex flex-col bg-background",
        "border border-line -mt-px md:mt-0 md:-ml-px first:ml-0 first:mt-0",
      )}
      style={{ padding: "var(--space-6)" }}
    >
      {/* ── SECTION 1: Header Box (Plan Name + Price) ── */}
      <div className="pricing-header-box p-5 mb-5 bg-muted/50">
        {/* Gradient layer — hidden by default, shown on hover */}
        <div
          className="pricing-header-gradient"
          style={{ background: gradient }}
        />
        {/* Noise/grain overlay */}
        <div className="pricing-header-noise" />

        {/* Content */}
        <div className="pricing-header-content">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="pricing-header-text text-lg font-semibold tracking-tight text-foreground transition-colors duration-500">
              {name}
            </h3>
            {isPopular && (
              <span className="pricing-header-badge text-[10px] font-semibold uppercase tracking-wider border border-foreground/20 text-foreground/70 px-2 py-0.5 transition-colors duration-500">
                Popular
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1.5">
            {price === "Custom" ? (
              <span className="pricing-header-text text-3xl font-bold tracking-tight text-foreground transition-colors duration-500">
                Custom
              </span>
            ) : (
              <>
                <span className="pricing-header-text text-3xl font-bold tracking-tight leading-none text-foreground transition-colors duration-500">
                  ${price}
                </span>
                <span className="pricing-header-subtext text-sm font-normal text-muted-foreground transition-colors duration-500">
                  per month
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: CTA Button ── */}
      <SharpButton
        variant={isPopular ? "primary" : "outline"}
        className="w-full mb-6"
        shine
      >
        {ctaText}
      </SharpButton>

      {/* ── SECTION 3: Features List ── */}
      <div className="flex flex-col flex-1">
        {inheritsFrom && (
          <div className="flex items-center gap-2 py-3 border-b border-dashed border-line">
            <span className="text-[13px] text-muted-foreground leading-relaxed">
              Everything in {inheritsFrom}, plus
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/60" strokeWidth={2} />
          </div>
        )}
        {features.map((feature, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-3 py-3",
              i < features.length - 1 && "border-b border-dashed border-line"
            )}
          >
            <Check className="w-4 h-4 text-foreground/40 shrink-0 mt-0.5" strokeWidth={2} />
            <span className="text-[13px] text-foreground/80 leading-relaxed">
              {feature}
            </span>
          </div>
        ))}
      </div>

      {/* ── SECTION 4: Footer (Credits) ── */}
      <div className="mt-6 pt-4 border-t border-line">
        <p className="text-[13px] text-muted-foreground">
          {aiTag}
        </p>
      </div>
    </div>
  );
}
