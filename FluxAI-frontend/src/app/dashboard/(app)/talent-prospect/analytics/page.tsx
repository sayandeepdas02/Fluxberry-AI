import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LineChart } from "lucide-react";

export default function ProspectAnalyticsPage() {
  return (
    <PageContainer
      title="Prospect Analytics"
      description="Track outreach performance, response rates, and prospect engagement."
    >
      <EmptyState
        icon={LineChart}
        title="No prospect data yet"
        description="Analytics will populate once you start running outreach campaigns."
      />
    </PageContainer>
  );
}
