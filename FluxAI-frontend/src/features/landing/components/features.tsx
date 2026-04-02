"use client";

import { Command, MonitorSmartphone, Blocks, Layers } from "lucide-react";

export function Features() {
  return (
    <section className="w-full border-y border-border py-24 bg-background overflow-hidden relative z-10">
      <div className="mx-auto w-full max-w-[var(--container-max,1280px)] border-x border-border">
        
        {/* SECTION HEADER */}
        <div className="flex flex-col items-center text-center gap-4 mb-16 pt-16">
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

        {/* FEATURE GRID */}
        <div className="mt-12 px-8 md:px-12 w-full">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-0 border border-border bg-background">
            
            {/* TOP LEFT */}
            <div className="col-span-1 md:col-span-1 md:border-r border-b border-border p-10 flex flex-col justify-between">
              <div className="flex flex-col gap-3 mb-10">
                <h3 className="text-2xl font-semibold tracking-tight text-foreground">ATS Dashboard & Tracking</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Centralized candidate tracking with real-time analytics. Your entire hiring pipeline mapped in a single, rigid view.
                </p>
              </div>
              
              <div className="border border-border w-full h-[300px] flex items-center justify-center p-6 lg:p-8 relative bg-background">
                 {/* Internal structural mockup */}
                 <div className="w-full h-full border border-border bg-muted/5 flex flex-col p-4 gap-4">
                    <div className="h-4 w-24 bg-muted border border-border" />
                    <div className="grid grid-cols-3 gap-3">
                       <div className="h-16 border border-border bg-background flex flex-col items-center justify-center">
                         <span className="text-sm font-semibold text-foreground">1.2k</span>
                       </div>
                       <div className="h-16 border border-border bg-background flex flex-col items-center justify-center">
                         <span className="text-sm font-semibold text-foreground">342</span>
                       </div>
                       <div className="h-16 border border-border bg-background flex items-center justify-center text-muted-foreground">
                         <Layers className="w-5 h-5" />
                       </div>
                    </div>
                    <div className="flex-1 border border-border bg-background" />
                 </div>
              </div>
            </div>

            {/* TOP RIGHT */}
            <div className="col-span-1 md:col-span-1 border-b border-border p-10 flex flex-col justify-between">
              <div className="flex flex-col gap-3 mb-10">
                <h3 className="text-3xl font-semibold tracking-tight leading-tight text-foreground">
                  Instant value.<br/>Zero setup time.
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Start screening and scheduling instantly without complex implementation cycles.
                </p>
              </div>
              
              <div className="border border-border w-full h-[300px] flex flex-col items-center justify-center p-6 lg:p-8 bg-background">
                 <div className="w-full h-full border border-border bg-muted/5 flex items-center justify-center p-6">
                    <div className="w-full max-w-[200px] aspect-square border border-border bg-background flex flex-col items-center justify-center gap-4">
                       <div className="w-12 h-12 border border-border flex items-center justify-center bg-primary/5 text-primary">
                          <MonitorSmartphone className="w-6 h-6" />
                       </div>
                       <div className="w-1/2 h-1.5 bg-muted/50 border border-border/50" />
                       <div className="w-1/3 h-1.5 bg-muted/50 border border-border/50" />
                    </div>
                 </div>
              </div>
            </div>

            {/* BOTTOM LEFT */}
            <div className="col-span-1 md:col-span-1 border-b md:border-b-0 md:border-r border-border p-10 flex flex-col items-center justify-center text-center gap-8 min-h-[400px]">
              <div className="flex flex-col gap-2 relative z-10 items-center mt-auto mb-4">
                 <h3 className="text-xl font-semibold text-foreground">Global AI Command</h3>
                 <p className="text-muted-foreground text-sm max-w-[220px]">
                   Trigger your AI hiring assistant from anywhere in the OS.
                 </p>
              </div>
              <div className="flex items-center gap-3 mb-auto">
                <div className="border border-border w-16 h-16 flex items-center justify-center bg-background text-lg font-medium text-foreground">
                  <Command className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="border border-border w-16 h-16 flex items-center justify-center bg-background text-lg font-medium text-foreground">
                  K
                </div>
              </div>
            </div>

            {/* BOTTOM RIGHT */}
            <div className="col-span-1 md:col-span-1 p-10 flex flex-col gap-8 min-h-[400px] justify-between">
              <div className="flex flex-col gap-2">
                 <h3 className="text-xl font-semibold text-foreground">Native Ecosystem</h3>
                 <p className="text-muted-foreground text-sm">Syncs directly with your existing stack.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-0">
                 {[1, 2, 3, 4, 5, 6].map((i) => (
                   <div key={i} className="aspect-square border border-border flex items-center justify-center bg-muted/5 transition-colors">
                      <Blocks className="w-5 h-5 text-muted-foreground/30" />
                   </div>
                 ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
