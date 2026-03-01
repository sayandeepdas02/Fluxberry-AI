"use client";

import { Panel, PanelContent, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { BrainCircuit, Link2, Search, LineChart, FileText, Share2, Plus, Zap } from "lucide-react";

export function Features() {
    return (
        <Panel id="features">
            <PanelHeader>
                <div className="flex flex-col items-start gap-4 mb-4">
                    <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <span className="text-foreground text-xs">●</span> Features
                    </span>
                    <PanelTitle className="text-3xl md:text-5xl max-w-xl leading-tight">
                        Everything you need<br />to get <span className="text-muted-foreground">better</span> at hiring
                    </PanelTitle>
                </div>
            </PanelHeader>

            <PanelContent className="py-8">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* ---------- ROW 1 ---------- */}

                    {/* 1. Smart Hiring (1/3) */}
                    <div className="col-span-1 border border-border rounded-xl p-8 bg-background flex flex-col hover:border-foreground/20 transition-colors shadow-sm relative overflow-hidden h-[400px]">
                        <div className="z-10 relative mb-8">
                            <BrainCircuit className="w-5 h-5 text-foreground mb-4" />
                            <h3 className="text-lg font-bold mb-2">Smart Hiring</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Automate screening, rank candidates, halve hiring time.
                            </p>
                        </div>

                        {/* Mock UI: Candidate List */}
                        <div className="mt-auto -mx-4 -mb-4 bg-muted/20 border border-border rounded-t-xl p-4 opacity-80 pointer-events-none translate-y-4 shadow-sm h-[200px]">
                            <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                                <span className="text-xs font-semibold">Smart recruiting</span>
                                <div className="flex items-center gap-1 text-[10px] bg-background border border-border px-2 py-0.5 rounded-full text-muted-foreground">
                                    <Search className="w-3 h-3" /> Search
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { name: "Nuray Aksoy", role: "Product Manager", skill: "Time Management" },
                                    { name: "Arthur Taylor", role: "Entrepreneur / CEO", skill: "Leadership Skills" }
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-foreground/10" />
                                            <div>
                                                <div className="text-[10px] font-bold">{c.name}</div>
                                                <div className="text-[8px] text-muted-foreground">{c.role}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-medium">{c.skill}</div>
                                            <div className="text-[8px] text-muted-foreground">Aug 21</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 2. Predictive Insights (2/3) */}
                    <div className="col-span-1 md:col-span-2 border border-border rounded-xl p-8 bg-background flex flex-col hover:border-foreground/20 transition-colors shadow-sm relative overflow-hidden h-[400px]">
                        <div className="z-10 relative mb-8">
                            <LineChart className="w-5 h-5 text-foreground mb-4" />
                            <h3 className="text-lg font-bold mb-2">Predictive Insights</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                AI highlights attrition, performance, and workforce gaps early.
                            </p>
                        </div>

                        {/* Mock UI: Employee Spotlight */}
                        <div className="mt-auto mx-auto w-full max-w-lg bg-background border border-border rounded-t-xl p-6 shadow-md pointer-events-none translate-y-4 h-[250px] relative">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-xs font-bold">Employee Spotlight</span>
                                <div className="text-[10px] font-medium flex items-center gap-1 text-muted-foreground">
                                    <Share2 className="w-3 h-3" /> Share
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-8 bg-muted/40 p-1 rounded-lg">
                                <div className="text-center text-[10px] font-bold bg-background py-1.5 rounded border border-border shadow-sm">Overview</div>
                                <div className="text-center text-[10px] font-medium text-muted-foreground py-1.5">Comments</div>
                                <div className="text-center text-[10px] font-medium text-muted-foreground py-1.5">Rewards</div>
                            </div>

                            <div className="text-center flex flex-col items-center">
                                <h4 className="text-sm font-bold">Matthew Johnson</h4>
                                <p className="text-[10px] text-muted-foreground mb-4">Software Engineer</p>

                                <div className="w-16 h-16 rounded-full bg-muted/50 border-4 border-background flex items-center justify-center relative shadow-sm">
                                    <div className="w-12 h-12 rounded-full bg-foreground/10" />
                                    {/* Abstract Badge Ribbon */}
                                    <div className="absolute -bottom-2 -left-4 -right-4 h-4 bg-muted/30 border border-border -z-10 transform -rotate-2"></div>
                                    <div className="absolute -bottom-2 -left-4 -right-4 h-4 bg-muted/30 border border-border -z-10 transform rotate-2"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ---------- ROW 2 ---------- */}

                    {/* 3. Workflow Automation (2/3) */}
                    <div className="col-span-1 md:col-span-2 border border-border rounded-xl p-8 bg-background flex flex-col hover:border-foreground/20 transition-colors shadow-sm relative overflow-hidden h-[400px]">
                        <div className="z-10 relative mb-8">
                            <Link2 className="w-5 h-5 text-foreground mb-4" />
                            <h3 className="text-lg font-bold mb-2">Workflow Automation</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Fluxberry AI automates HR tasks, teams focus on people.
                            </p>
                        </div>

                        {/* Mock UI: Available Automations */}
                        <div className="mt-auto w-full bg-background border border-border rounded-xl p-6 shadow-sm pointer-events-none translate-y-4">
                            <h4 className="text-xs font-bold mb-1">Available Automations</h4>
                            <p className="text-[10px] text-muted-foreground mb-6">
                                Access the integrated tools and apps ready for your HR tasks.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-border/60 rounded-lg p-4 bg-muted/10 relative">
                                    <div className="absolute top-4 right-4 w-6 h-3 bg-foreground rounded-full" />
                                    <div className="w-8 h-8 rounded bg-[#0078D4] text-white flex items-center justify-center font-bold text-xs mb-3">M</div>
                                    <div className="text-xs font-bold mb-1">Microsoft Office 365</div>
                                    <div className="text-[9px] text-muted-foreground mb-3 leading-tight">Seamless collaboration and document management.</div>
                                    <div className="border border-border text-[10px] text-center py-1.5 rounded bg-background font-medium">Manage</div>
                                </div>

                                <div className="border border-border/60 rounded-lg p-4 bg-muted/10 relative">
                                    <div className="absolute top-4 right-4 w-6 h-3 bg-muted border border-border rounded-full" />
                                    <div className="w-8 h-8 rounded bg-[#2D8CFF] text-white flex items-center justify-center font-bold text-xs mb-3">Z</div>
                                    <div className="text-xs font-bold mb-1">Zoom</div>
                                    <div className="text-[9px] text-muted-foreground mb-3 leading-tight">For conducting virtual meetings and interviews natively.</div>
                                    <div className="border border-border text-[10px] text-center py-1.5 rounded bg-muted/30 text-muted-foreground font-medium">Disconnected</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Employee Engagement Analytics (1/3) */}
                    <div className="col-span-1 border border-border rounded-xl p-8 bg-background flex flex-col hover:border-foreground/20 transition-colors shadow-sm relative overflow-hidden h-[400px]">
                        <div className="z-10 relative mb-8">
                            <FileText className="w-5 h-5 text-foreground mb-4" />
                            <h3 className="text-lg font-bold mb-2 text-foreground">Employee Engagement analytics</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Surveys drive action, improving culture and retention.
                            </p>
                        </div>

                        {/* Mock UI: Sparkline Graph */}
                        <div className="mt-auto -mx-4 -mb-4 bg-background border border-border border-b-0 rounded-t-xl p-6 opacity-90 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] pointer-events-none translate-y-4 h-[200px]">
                            <div className="text-[10px] font-bold mb-4">Work Hour Analysis</div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-foreground"></div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-muted-foreground uppercase tracking-wider">Total Work</div>
                                    <div className="text-xs font-bold">38 hours <span className="text-muted-foreground font-normal">· 12 mins</span></div>
                                </div>
                            </div>

                            <div className="w-full h-px bg-border my-4 relative">
                                <div className="absolute left-1/3 w-1/3 h-[2px] bg-foreground bottom-0"></div>
                            </div>

                            {/* Abstract SVG line graph */}
                            <div className="w-full h-16 mt-4 relative">
                                <svg className="w-full h-full text-foreground/20" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <polyline fill="none" stroke="currentColor" strokeWidth="2" points="0,30 20,20 40,35 60,10 80,25 100,5" />
                                    <circle cx="60" cy="10" r="3" fill="var(--background)" stroke="var(--foreground)" strokeWidth="2" />
                                </svg>
                                <div className="absolute top-0 left-[60%] -translate-x-1/2 -mt-4 bg-foreground text-background text-[8px] px-1.5 py-0.5 rounded shadow">
                                    Monday, 6h
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ---------- ROW 3 ---------- */}

                    {/* 5. Real time performance reporting (1/3) */}
                    <div className="col-span-1 border border-border rounded-xl p-8 bg-background flex flex-col hover:border-foreground/20 transition-colors shadow-sm relative overflow-hidden h-[400px]">
                        <div className="z-10 relative mb-8">
                            <Zap className="w-5 h-5 text-foreground mb-4" />
                            <h3 className="text-lg font-bold mb-2">Real time performance reporting</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Generates live performance reports for faster decisions.
                            </p>
                        </div>

                        {/* Mock UI: Simple list */}
                        <div className="mt-auto -mx-2 bg-muted/20 border border-border rounded-xl p-4 opacity-80 pointer-events-none h-[200px]">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-[10px] font-bold">Current Project</span>
                                <span className="text-[8px] text-muted-foreground">See</span>
                            </div>

                            <div className="bg-background border border-border rounded p-3 mb-2 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[9px] font-bold flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-sm bg-orange-400" /> Monday.com Redesign
                                    </span>
                                    <span className="text-[8px] text-background bg-foreground px-1.5 py-0.5 rounded-full">In Progress</span>
                                </div>
                                <div className="flex justify-between items-center mt-3 border-t border-border/50 pt-2">
                                    <div className="flex -space-x-1">
                                        <div className="w-4 h-4 rounded-full bg-foreground/20 border border-background"></div>
                                        <div className="w-4 h-4 rounded-full bg-foreground/30 border border-background"></div>
                                        <div className="w-4 h-4 rounded-full bg-foreground/10 border border-background"></div>
                                    </div>
                                    <span className="text-[8px] text-muted-foreground">12/10/2022 - 01/04/2023</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 6. Advanced Talent Analytics (2/3) */}
                    <div className="col-span-1 md:col-span-2 border border-border rounded-xl p-8 bg-background flex flex-col hover:border-foreground/20 transition-colors shadow-sm relative overflow-hidden h-[400px]">
                        <div className="z-10 relative mb-8">
                            <Plus className="w-5 h-5 text-foreground mb-4" />
                            <h3 className="text-lg font-bold mb-2">Advanced Talent Analytics</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Fluxberry AI predicts gaps, automates learning, future-proofs teams.
                            </p>
                        </div>

                        {/* Mock UI: Compensation Planner List */}
                        <div className="mt-auto mx-auto w-full max-w-lg bg-background border border-border rounded-t-xl p-6 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] pointer-events-none translate-y-4 h-[250px]">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-border">
                                <span className="text-sm font-bold">Compensation planner</span>
                                <span className="text-[10px] font-medium text-muted-foreground bg-muted p-1 rounded px-2">See All</span>
                            </div>

                            <div className="mb-4">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-3">Absent</span>
                                <div className="flex items-center justify-between bg-muted/20 p-2 rounded">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-foreground/10" />
                                        <div>
                                            <div className="text-xs font-bold text-foreground flex items-center gap-1">James Brown <span className="w-2 h-2 rounded-full bg-red-400"></span></div>
                                            <div className="text-[10px] text-muted-foreground">Replaced by Arthur T.</div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-muted-foreground bg-muted px-2 py-1 rounded-full">● Absent</span>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-3">Away</span>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-full bg-foreground/10" />
                                    <div>
                                        <div className="text-xs font-bold text-foreground">Sophia Williams</div>
                                        <div className="text-[10px] text-muted-foreground">Synergy</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </PanelContent>
        </Panel>
    );
}
