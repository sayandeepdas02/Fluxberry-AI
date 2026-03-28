"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { JobForm } from "@/features/jobs/components/job-form";
import { jobsApi, Job, CreateJobInput } from "@/lib/api/jobs";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PageProps {
    params: Promise<{ jobId: string }>;
}

export default function EditJobPage({ params }: PageProps) {
    const { jobId } = use(params);
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function fetchJob() {
            setIsLoading(true);
            const response = await jobsApi.getById(jobId);
            if (response.success && response.data) {
                setJob(response.data);
            } else {
                setError(response.error?.message || "Failed to load job");
            }
            setIsLoading(false);
        }
        fetchJob();
    }, [jobId]);

    const handleSubmit = async (data: CreateJobInput): Promise<Job> => {
        setIsSaving(true);
        setError(null);
        const response = await jobsApi.update(jobId, data);
        setIsSaving(false);
        if (response.success && response.data) {
            router.push("/dashboard/manage-jobs");
            return response.data;
        } else {
            const errMsg = response.error?.message || "Failed to save job";
            setError(errMsg);
            throw new Error(errMsg);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error && !job) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                <p className="text-red-400">{error}</p>
                <Link href="/dashboard/manage-jobs" className="text-sm text-muted-foreground hover:text-foreground underline">
                    Back to Jobs
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/manage-jobs" className="p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="text-xl font-semibold">Edit Job</h1>
                </div>

                {error && (
                    <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {job && (
                    <JobForm
                        mode="edit"
                        initialData={{
                            title: job.title,
                            description: job.description,
                            department: job.department,
                            location: job.location,
                            employmentType: job.employmentType,
                            requiredSkills: job.requiredSkills,
                            salaryRange: job.salaryRange,
                            applicationSchema: job.applicationSchema,
                        }}
                        onSubmit={handleSubmit}
                    />
                )}
            </div>
        </div>
    );
}
