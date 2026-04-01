import { JobWizard } from '@/features/jobs/components/job-wizard/job-wizard'

export default function NewJobPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 lg:p-10">
                <JobWizard />
            </div>
        </div>
    )
}
