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
    <div className={cn("max-w-[var(--container-max)] mx-auto w-full border-x border-line bg-background min-h-screen flex flex-col", className)}>
      {children}
    </div>
  );
}

/**
 * SectionWrapper (RigidSection)
 * Wraps entire sections with top/bottom borders (double-line effect when adjacent) and strict internal padding.
 */
export const SectionWrapper = React.forwardRef<HTMLElement, {
  id?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  noTopBorder?: boolean;
  noBottomBorder?: boolean;
}>(({
  id,
  children,
  className,
  style,
  noTopBorder = false,
  noBottomBorder = false,
}, ref) => {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "relative w-full bg-background px-6 sm:px-8",
        !noTopBorder && "border-t border-line",
        !noBottomBorder && "border-b border-line",
        className
      )}
      style={{
        paddingTop: "96px",
        paddingBottom: "96px",
        ...style,
      }}
    >
      {children}
    </section>
  );
});

SectionWrapper.displayName = "SectionWrapper";

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
        "border border-line bg-background p-8 rounded-none",
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
        "border border-line bg-background p-8 rounded-none",
        hoverEffect && "transition-colors duration-200 hover:bg-muted",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Shine hover CSS classes — reusable on any button element.
 * Creates a diagonal light sweep on hover.
 */
export const SHINE_CLASSES =
  "relative overflow-hidden before:absolute before:inset-0 before:rounded-[inherit] before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.7)_50%,transparent_75%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:transition-[background-position] before:duration-1000 before:ease-in-out hover:before:bg-[position:-100%_0,0_0] dark:before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)]";

/**
 * SharpButton
 * Replaces circular/rounded buttons with sharp 90-degree rigid buttons.
 * Pass `shine` to add the diagonal light-sweep hover effect.
 */
export function SharpButton({
  children,
  className,
  variant = "primary",
  shine = false,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  shine?: boolean;
}) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200 cursor-pointer text-sm px-6 py-3 rounded-none";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-secondary",
    outline: "border border-line bg-transparent hover:bg-muted text-foreground",
    ghost: "bg-transparent hover:bg-muted text-foreground",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], shine && SHINE_CLASSES, className)}
      style={{
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
