import { Button } from "@/components/ui/button"
import { Briefcase, FileText, CheckCircle, Users } from "lucide-react"
import Link from "next/link"
import { PageContainer } from "@/components/ui/page-container"
import { SectionHeader } from "@/components/ui/section-header"
import { EmptyState } from "@/components/ui/empty-state"
import { StatCard } from "@/components/dashboard/stat-card"

export default function DashboardPage() {
    return (
        <PageContainer>
            <SectionHeader
                title="Overview"
                description="Monitor your active roles, candidate pipelines, and overall recruitment metrics."
            />

            {/* Metrics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-10">
                <StatCard 
                    title="Active Jobs" 
                    value="0" 
                    icon={<Briefcase className="w-5 h-5" />} 
                    description="No jobs currently open"
                />
                <StatCard 
                    title="Total Candidates" 
                    value="0" 
                    icon={<Users className="w-5 h-5" />} 
                    description="Waiting for first applicant"
                />
                <StatCard 
                    title="Interviews Held" 
                    value="0" 
                    icon={<FileText className="w-5 h-5" />} 
                    description="None scheduled yet"
                />
                <StatCard 
                    title="Avg. Pass Rate" 
                    value="-" 
                    icon={<CheckCircle className="w-5 h-5" />} 
                    description="Insufficient data"
                />
            </div>

            <EmptyState
                icon={<Briefcase className="h-8 w-8" />}
                title="Ready to hire your next star?"
                description="You haven't created any roles yet. Launch a new automated interview pipeline to start evaluating candidates instantly."
                action={
                    <Link href="/dashboard/jobs/new">
                        <Button variant="gradient" size="lg" className="rounded-full shadow-md text-[15px] px-8 py-6 h-auto">
                            Create Your First Job
                        </Button>
                    </Link>
                }
            />
        </PageContainer>
    )
}
