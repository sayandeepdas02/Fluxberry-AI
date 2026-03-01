"use client";

import { useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";

export function PricingAiCredits() {
    const [jobs, setJobs] = useState<number>(5);
    const [resumes, setResumes] = useState<number>(1000);
    const [mcq, setMcq] = useState<number>(20);
    const [coding, setCoding] = useState<number>(10);
    const [video, setVideo] = useState<number>(5);
    const [bundle, setBundle] = useState<number>(0);

    // Calculate base plan from resumes (Starter up to 2,000, Growth up to 10,000)
    let basePlanName = "Starter";
    let basePlanCost: number | "Custom" = 149;

    if (resumes > 10000) {
        basePlanName = "Enterprise";
        basePlanCost = "Custom";
    } else if (resumes > 2000) {
        basePlanName = "Growth";
        basePlanCost = 399;
    }

    // AI Credits cost calculation (Hidden logic: MCQ=$1, Coding=$4, Video=$3, Bundle=$6)
    const totalCredits = (mcq * 1) + (coding * 4) + (video * 3) + (bundle * 6);
    const aiCost = totalCredits; // Since $1 = 1 Credit

    return (
        <section className="mb-32 px-4 max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4 flex items-center justify-center gap-3">
                    <Calculator className="w-8 h-8 text-foreground" />
                    Estimate Your Cost
                </h2>
                <p className="text-muted-foreground text-lg">
                    Build your custom hiring pipeline. <strong>$1 = 1 AI Credit.</strong>
                </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 bg-background border border-border rounded-xl shadow-sm overflow-hidden p-6 md:p-10">

                {/* Inputs */}
                <div className="lg:col-span-3 space-y-10 pr-0 md:pr-8">
                    <div>
                        <h3 className="text-xl font-bold mb-6">Platform Setup</h3>
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Active Jobs</label>
                                    <span className="font-bold bg-muted px-2 py-1 rounded text-sm">{jobs}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="200"
                                    value={jobs}
                                    onChange={(e) => setJobs(Number(e.target.value))}
                                    className="w-full h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Unlimited job posts are included in all plans.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Resumes to Screen / mo</label>
                                    <span className="font-bold bg-muted px-2 py-1 rounded text-sm">{resumes.toLocaleString()}</span>
                                </div>
                                <input
                                    type="range"
                                    min="100"
                                    max="20000"
                                    step="100"
                                    value={resumes}
                                    onChange={(e) => setResumes(Number(e.target.value))}
                                    className="w-full h-2 bg-muted/50 rounded-lg appearance-none cursor-pointer accent-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Determines your base platform tier (Starter, Growth, Enterprise).</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border">
                        <h3 className="text-xl font-bold mb-3">AI Interviews & Assessments</h3>
                        <p className="text-sm text-muted-foreground mb-6">Select how many of each test you plan to run monthly. Standard pricing applied as AI Credits.</p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/50">
                                <div className="flex-1">
                                    <div className="text-sm font-medium">MCQ Screenings</div>
                                </div>
                                <input type="number" min="0" value={mcq} onChange={(e) => setMcq(Number(e.target.value))} className="w-24 px-3 py-2 border border-border rounded-md bg-background text-sm text-center" />
                            </div>

                            <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/50">
                                <div className="flex-1">
                                    <div className="text-sm font-medium">Coding Assessments</div>
                                </div>
                                <input type="number" min="0" value={coding} onChange={(e) => setCoding(Number(e.target.value))} className="w-24 px-3 py-2 border border-border rounded-md bg-background text-sm text-center" />
                            </div>

                            <div className="flex items-center gap-4 bg-muted/20 p-3 rounded-lg border border-border/50">
                                <div className="flex-1">
                                    <div className="text-sm font-medium">AI Video Interviews</div>
                                </div>
                                <input type="number" min="0" value={video} onChange={(e) => setVideo(Number(e.target.value))} className="w-24 px-3 py-2 border border-border rounded-md bg-background text-sm text-center" />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-muted/60 rounded-lg border border-border mt-6">
                                <div className="flex-1">
                                    <div className="text-sm font-medium flex items-center gap-2">Combined Bundle <span className="bg-foreground text-background text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Save</span></div>
                                    <div className="text-xs text-muted-foreground mt-1">Run all 3 tests automatically on a single candidate pipeline.</div>
                                </div>
                                <input type="number" min="0" value={bundle} onChange={(e) => setBundle(Number(e.target.value))} className="w-24 px-3 py-2 border border-foreground/30 rounded-md bg-background text-sm font-bold text-center" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="lg:col-span-2 bg-foreground text-background rounded-2xl p-8 flex flex-col justify-between shadow-xl mt-8 lg:mt-0">
                    <div>
                        <h3 className="font-bold text-2xl mb-8 text-background/90 text-center">Estimated Monthly Cost</h3>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center border-b border-background/20 pb-4">
                                <div className="text-background/80 text-sm">Base Platform ({basePlanName})</div>
                                <div className="font-bold text-lg">{basePlanCost === "Custom" ? "Custom" : `$${basePlanCost}`}</div>
                            </div>
                            <div className="flex justify-between items-center border-b border-background/20 pb-4">
                                <div className="text-background/80 text-sm flex flex-col">
                                    <span>AI Usage Need</span>
                                    <span className="text-xs text-background/50 mt-1">{totalCredits.toLocaleString()} Credits</span>
                                </div>
                                <div className="font-bold text-lg">${aiCost.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-end mb-8 bg-background/5 p-4 rounded-xl border border-background/10">
                            <div className="text-background/80 font-medium">Total Cost</div>
                            <div className="text-4xl font-extrabold text-background">
                                {basePlanCost === "Custom" ? "Custom" : `$${(basePlanCost + aiCost).toLocaleString()}`}
                            </div>
                        </div>

                        <button className="w-full bg-background text-foreground font-semibold py-4 px-4 rounded-xl hover:bg-background/90 transition-colors shadow-lg">
                            {basePlanCost === "Custom" ? "Contact Sales" : "Start Free Trial"}
                        </button>

                        <ul className="mt-8 space-y-4">
                            <li className="flex items-center gap-3 text-sm text-background/70">
                                <CheckCircle2 className="w-5 h-5 text-background/50 shrink-0" />
                                Custom jobs and resume parsing
                            </li>
                            <li className="flex items-center gap-3 text-sm text-background/70">
                                <CheckCircle2 className="w-5 h-5 text-background/50 shrink-0" />
                                No setup or platform connection fees
                            </li>
                            <li className="flex items-center gap-3 text-sm text-background/70">
                                <CheckCircle2 className="w-5 h-5 text-background/50 shrink-0" />
                                Unused AI credits roll over monthly
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
