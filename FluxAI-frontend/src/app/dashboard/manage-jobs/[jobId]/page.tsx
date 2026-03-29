"use client";

import * as React from "react";
import { use, useState } from "react";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, X, Loader2, Users, FileBarChart, LayoutDashboard } from "lucide-react";
import { useApplications } from "@/features/jobs/hooks/use-applications";
import { JobApplicationResponse } from "@/lib/api/applications";
import Link from "next/link";
import { toast } from "sonner";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { CandidateDrawer } from "@/features/pipeline/components/candidate-drawer";

interface PageProps {
    params: Promise<{ jobId: string }>;
}

export default function JobDetailsPage({ params }: PageProps) {
    const { jobId } = use(params);
    const {
        applications,
        stages,
        total,
        isLoading,
        error,
        search,
        setSearch,
        moveStage,
        refetch,
    } = useApplications(jobId);

    const [activeTab, setActiveTab] = useState<"overview" | "candidates" | "analytics">("candidates");
    const [searchInput, setSearchInput] = useState('');
    
    // Drawer state
    const [selectedCandidate, setSelectedCandidate] = useState<JobApplicationResponse | null>(null);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleStageChange = async (appId: string, stageId: string): Promise<boolean> => {
        try {
            await moveStage(appId, stageId);
            // Optimistically update the drawer state if open
            if (selectedCandidate && selectedCandidate._id === appId) {
                setSelectedCandidate(prev => prev ? {
                    ...prev,
                    currentStageId: stages.find(s => s._id === stageId) || prev.currentStageId,
                    status: stages.find(s => s._id === stageId)?.type as any || prev.status
                } : null);
            }
            toast.success("Candidate moved successfully");
            return true;
        } catch (error) {
            console.error("Failed to move candidate:", error);
            toast.error("Failed to move candidate");
            return false;
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Header Area */}
            <div className="flex-none px-6 py-4 border-b border-line bg-card space-y-4">
                {/* Breadcrumb & Global Actions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                        <Link href="/dashboard/manage-jobs" className="hover:text-foreground transition-colors">
                            Manage Jobs
                        </Link>
                        <span>/</span>
                        <span className="text-foreground font-medium">Job Details</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Search candidates..."
                                className="w-full h-8 rounded-none border border-line bg-background pl-9 pr-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchInput(''); setSearch(''); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground"
                                >
                                    <X className="w-3 h-3 text-muted-foreground" />
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-6 mt-6">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === "overview" 
                                ? "border-primary text-foreground" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab("candidates")}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === "candidates" 
                                ? "border-primary text-foreground" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Users className="w-4 h-4" />
                        Pipeline ({total})
                    </button>
                    <button
                        onClick={() => setActiveTab("analytics")}
                        className={cn(
                            "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                            activeTab === "analytics" 
                                ? "border-primary text-foreground" 
                                : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <FileBarChart className="w-4 h-4" />
                        Analytics
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-6">
                        <p className="text-red-500 font-medium">Failed to load pipeline</p>
                        <p className="text-sm text-muted-foreground mb-4">{error}</p>
                        <button 
                            onClick={() => refetch()} 
                            className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90"
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tab Content */}
                        {activeTab === "candidates" && (
                            <PipelineBoard 
                                applications={applications}
                                stages={stages}
                                onCandidateClick={(app) => setSelectedCandidate(app)}
                                onMoveCandidate={handleStageChange}
                            />
                        )}

                        {activeTab === "overview" && (
                            <div className="p-8 max-w-4xl space-y-6 overflow-y-auto h-full">
                                <h1 className="text-2xl font-semibold">Job Details & Configuration</h1>
                                <p className="text-muted-foreground">Configuration, Job Description, and Workflows will reside here.</p>
                                <div className="p-6 border border-line bg-muted/5 flex items-center justify-center h-64 border-dashed">
                                    <span className="text-muted-foreground/50">Overview Area Coming Soon</span>
                                </div>
                            </div>
                        )}

                        {activeTab === "analytics" && (
                            <div className="p-8 max-w-4xl space-y-6 overflow-y-auto h-full">
                                <h1 className="text-2xl font-semibold">Hiring Analytics</h1>
                                <p className="text-muted-foreground">Conversion rates, time to hire, and pipeline velocity.</p>
                                <div className="p-6 border border-line bg-muted/5 flex items-center justify-center h-64 border-dashed">
                                    <span className="text-muted-foreground/50">Metrics Engine Coming Soon</span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Global Candidate Profile Drawer */}
            <CandidateDrawer 
                open={!!selectedCandidate} 
                onOpenChange={(open) => !open && setSelectedCandidate(null)}
                candidate={selectedCandidate}
                stages={stages}
                onMoveStage={handleStageChange}
            />
        </div>
    );
}
