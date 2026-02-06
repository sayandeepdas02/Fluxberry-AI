"use client";

import { JobCard } from "@/features/jobs/components/job-card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useJobs } from "@/features/jobs/hooks/use-jobs";

export function ManageJobsView() {
    const { jobs, total, isLoading, error } = useJobs()

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading jobs...</div>
    }

    if (error) {
        return <div className="p-8 text-center text-destructive">Error: {error}</div>
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold mb-1">Manage Jobs</h1>
                    <p className="text-sm text-muted-foreground">{total} active job posts</p>
                </div>

                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground border-none shrink-0 font-medium font-mono">
                    <Plus className="w-4 h-4 mr-2" />
                    New Job Post
                </Button>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {jobs.map((job) => (
                    <JobCard key={job._id} job={job} />
                ))}
            </div>

            {/* Empty State could go here if jobs.length === 0 */}
        </div>
    );
}
