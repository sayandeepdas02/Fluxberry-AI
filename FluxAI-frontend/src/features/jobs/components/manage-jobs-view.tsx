"use client";

import { Job, JobCard } from "@/features/jobs/components/job-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { SAMPLE_JOBS as jobs } from "@/features/jobs/mocks/jobs";

export function ManageJobsView() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold mb-1">Manage Jobs</h1>
                        {/* Optional subtitle if desired */}
                    </div>

                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none shrink-0 font-medium font-mono">
                        <Plus className="w-4 h-4 mr-2" />
                        New Job Post
                    </Button>
                </div>

                {/* Jobs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {jobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                </div>

                {/* Empty State could go here if jobs.length === 0 */}
            </div>
        </div>
    );
}
