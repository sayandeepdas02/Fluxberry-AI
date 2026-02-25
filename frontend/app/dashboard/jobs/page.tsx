import { JobsList } from "@/components/dashboard/jobs-list"
import { PageContainer } from "@/components/ui/page-container"
import { SectionHeader } from "@/components/ui/section-header"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default function JobsPage() {
    return (
        <PageContainer>
            <SectionHeader
                title="Active Roles"
                description="Manage your open positions, create new automated interviews, and track current hiring pipelines."
                actions={
                    <Link href="/dashboard/jobs/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Job
                        </Button>
                    </Link>
                }
            />
            <div className="w-full">
                <JobsList />
            </div>
        </PageContainer>
    )
}
