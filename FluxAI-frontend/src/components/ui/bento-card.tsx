"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export interface BentoCardProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  index?: number;
  className?: string;
}

export function BentoCard({ title, subtitle, icon, index = 0, className }: BentoCardProps) {
  const renderVisual = () => {
    switch (index % 6) {
      case 0:
        return (
          <div className="flex gap-3 flex-col w-full h-full p-6 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <div className="w-full h-6 bg-muted/60 rounded-md border border-border" />
            <div className="w-3/4 h-6 bg-muted/60 rounded-md border border-border" />
            <div className="w-1/2 h-6 bg-muted/60 rounded-md border border-border" />
          </div>
        );
      case 1:
        return (
          <div className="relative w-full h-full flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute w-28 h-28 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-700">
              <div className="w-16 h-16 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-primary/60" />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-2 gap-3 p-6 w-full h-full opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <div className="bg-muted/60 rounded-lg border border-border h-full group-hover:-translate-y-1 transition-transform duration-500 delay-75" />
            <div className="bg-muted/60 rounded-lg border border-border h-full group-hover:-translate-y-1 transition-transform duration-500 delay-100" />
            <div className="bg-muted/60 rounded-lg border border-border h-full col-span-2 group-hover:-translate-y-1 transition-transform duration-500 delay-150" />
          </div>
        );
      case 3:
        return (
          <div className="flex items-end justify-center p-6 h-full gap-2 w-full opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            {[40, 70, 45, 90, 60].map((h, i) => (
              <motion.div
                key={i}
                className="w-8 bg-primary/20 rounded-t-sm border-t border-x border-primary/30"
                initial={{ height: "10%" }}
                whileInView={{ height: `${h}%` }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
              />
            ))}
          </div>
        );
      case 4:
        return (
          <div className="p-6 w-full h-full flex flex-col justify-center gap-4 opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-3 group-hover:translate-x-2 transition-transform duration-500">
              <div className="w-10 h-10 rounded-full bg-muted/60 border border-border shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="w-full max-w-[120px] h-2 bg-muted/60 rounded-full" />
                <div className="w-full max-w-[80px] h-2 bg-muted/60 rounded-full" />
              </div>
            </div>
            <div className="flex items-center gap-3 ml-6 group-hover:translate-x-2 transition-transform duration-500 delay-75">
              <div className="w-10 h-10 rounded-full bg-muted/60 border border-border shrink-0" />
              <div className="flex flex-col gap-2 w-full">
                <div className="w-full max-w-[100px] h-2 bg-muted/60 rounded-full" />
                <div className="w-full max-w-[60px] h-2 bg-muted/60 rounded-full" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="p-4 w-full h-full overflow-hidden flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity duration-500">
            <div className="grid grid-cols-3 gap-3 w-[150%] group-hover:scale-110 transition-transform duration-700">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted/60 rounded-xl border border-border" />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.1 }}
      className={cn(
        "group h-full",
        className
      )}
    >
      <div className="relative h-full rounded-none border border-border/40 p-2 md:rounded-none md:p-3 bg-card/10">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
        />
        <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-none border border-border bg-background transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 dark:shadow-[0px_0px_27px_0px_#101010]">

      {/* Decorative Gradient Glow */}
      <div className="absolute top-0 right-0 -m-16 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Visual Mockup Area */}
      <div className="h-[200px] w-full border-b border-border bg-muted/10 relative overflow-hidden flex items-center justify-center">
        {renderVisual()}
      </div>

      {/* Content Area */}
      <div className="p-6 md:p-8 flex flex-col gap-3 relative z-10 bg-background/50">
        {icon && (
          <div className="mb-1 text-muted-foreground group-hover:text-primary transition-colors duration-500">
            {icon}
          </div>
        )}
        <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground transition-colors duration-300">
          {title}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
          {subtitle}
        </p>
      </div>

      {/* Inner subtle outline on hover */}
      <div className="absolute inset-0 border rounded-none border-transparent group-hover:border-primary/10 transition-colors duration-500 pointer-events-none" />
        </div>
      </div>
    </motion.div>
  );
}
