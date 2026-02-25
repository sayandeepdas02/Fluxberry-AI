import { JobWizard } from "@/components/jobs/job-wizard"
import { PageContainer } from "@/components/ui/page-container"
import { SectionHeader } from "@/components/ui/section-header"

export default function NewJobPage() {
    return (
        <PageContainer>
            <SectionHeader
                title="Create New Job"
                description="Launch a new automated interview role to start screening candidates."
            />
            <div className="w-full">
                <JobWizard />
            </div>
        </PageContainer>
    )
}
