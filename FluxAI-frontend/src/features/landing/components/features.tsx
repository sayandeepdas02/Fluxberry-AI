"use client";

import { BentoCard } from "@/components/ui/bento-card";
import { 
  BarChart, 
  Search, 
  Calendar, 
  Users, 
  LineChart, 
  Link 
} from "lucide-react";

const featuresData = [
  {
    title: "ATS Dashboard & Tracking",
    subtitle: "Centralized hiring pipeline with real-time analytics mapped in a single view.",
    icon: <BarChart className="w-6 h-6" />
  },
  {
    title: "AI Resume Screening",
    subtitle: "Automatically parse, score, and rank candidates instantly to cut manual review time.",
    icon: <Search className="w-6 h-6" />
  },
  {
    title: "Interview Scheduling",
    subtitle: "Eliminate the back-and-forth ping pong with automated availability syncing.",
    icon: <Calendar className="w-6 h-6" />
  },
  {
    title: "Candidate CRM",
    subtitle: "Nurture talent pools and maintain active relationships beyond just open roles.",
    icon: <Users className="w-6 h-6" />
  },
  {
    title: "Analytics & Insights",
    subtitle: "Uncover hiring bottlenecks, source quality, and track your essential KPI velocity.",
    icon: <LineChart className="w-6 h-6" />
  },
  {
    title: "Integrations Ecosystem",
    subtitle: "A massive universe of native integrations linking directly with your existing stack.",
    icon: <Link className="w-6 h-6" />
  }
];

export function Features() {
  return (
    <section className="w-full border-y border-border py-24 bg-background overflow-hidden relative z-10">
      <div className="mx-auto w-full max-w-[var(--container-max,1280px)] border-x border-border px-6 md:px-12">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="text-xs border border-border px-3 py-1 bg-background uppercase tracking-widest text-foreground font-medium">
            Features
          </div>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
            Built for modern hiring teams
          </h2>

          <p className="text-muted-foreground max-w-[600px] text-lg">
            Everything you need to automate and optimize your hiring workflow.
          </p>
        </div>

        {/* BENTO GRID */}
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuresData.map((feature, index) => (
            <BentoCard 
              key={index}
              index={index}
              title={feature.title}
              subtitle={feature.subtitle}
              icon={feature.icon}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
