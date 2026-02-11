'use client'

import { JobForm } from '@/features/jobs/components/job-form'
import { useJobs } from '@/features/jobs/hooks/use-jobs'
import type { CreateJobInput } from '@/lib/api/jobs'

export default function NewJobPage() {
    const { createJob } = useJobs()

    const handleSubmit = async (data: CreateJobInput) => {
        return createJob(data)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6">
                <JobForm mode="create" onSubmit={handleSubmit} />
            </div>
        </div>
    )
}
