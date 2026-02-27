import { AtsDashboardPage } from "@/features/ats-screening/pages/ats-dashboard-page"

interface PageProps {
    params: {
        jobId: string
    }
}

export default function AtsScreeningDashboardRoute({ params }: PageProps) {
    return <AtsDashboardPage jobId={params.jobId} />
}
