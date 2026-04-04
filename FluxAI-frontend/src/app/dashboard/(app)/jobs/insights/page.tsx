import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TrendingUp } from "lucide-react";

export default function JobInsightsPage() {
  return (
    <PageContainer
      title="Job Insights"
      description="Analyze job performance, application rates, and sourcing channels."
    >
      <EmptyState
        icon={TrendingUp}
        title="No insights available"
        description="Post jobs and receive applications to start seeing performance insights."
      />
    </PageContainer>
  );
}
