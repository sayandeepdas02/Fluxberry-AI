import React from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────
   LAYOUT PRIMITIVES (Reflex.dev Inspired)
   Strict grids, sharp 90-degree boxes, no soft shadows
   ───────────────────────────────────────────────── */

/**
 * MainContainer
 * Global layout wrapper to enforce continuous left/right borders and align content centrally.
 */
export function MainContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("max-w-[1280px] mx-auto px-0 sm:px-8 w-full border-x border-border bg-background min-h-screen flex flex-col", className)}>
      {children}
    </div>
  );
}

/**
 * SectionWrapper (RigidSection)
 * Wraps entire sections with top/bottom borders (double-line effect when adjacent) and strict internal padding.
 */
export function SectionWrapper({
  id,
  children,
  className,
  style,
  noTopBorder = false,
  noBottomBorder = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noTopBorder?: boolean;
  noBottomBorder?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        "relative w-full bg-background",
        !noTopBorder && "border-t border-border",
        !noBottomBorder && "border-b border-border",
        className
      )}
      style={{
        paddingTop: "var(--space-20)",
        paddingBottom: "var(--space-20)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

/**
 * BoxedContainer
 * A sharp bounding box for groups of components.
 */
export function BoxedContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-border bg-background p-6 lg:p-10",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * BoxedCard
 * Replaces all cards. Hard borders.
 */
export function BoxedCard({
  children,
  className,
  hoverEffect = false,
}: {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-border bg-card p-6 md:p-8",
        hoverEffect && "transition-colors duration-200 hover:bg-muted/50",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * SharpButton
 * Replaces circular/rounded buttons with sharp 90-degree rigid buttons.
 */
export function SharpButton({
  children,
  className,
  variant = "primary",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer text-sm px-5 py-2.5 shadow-sm";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
    outline: "border border-border bg-transparent hover:bg-muted text-foreground",
    ghost: "bg-transparent hover:bg-muted text-foreground",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
