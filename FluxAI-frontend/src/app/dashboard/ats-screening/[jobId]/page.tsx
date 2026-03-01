import { AtsDashboardPage } from "@/features/ats-screening/pages/ats-dashboard-page"

interface PageProps {
    params: Promise<{
        jobId: string
    }>
}

export default async function AtsScreeningDashboardRoute({ params }: PageProps) {
    const resolvedParams = await params;
    return <AtsDashboardPage jobId={resolvedParams.jobId} />
}
