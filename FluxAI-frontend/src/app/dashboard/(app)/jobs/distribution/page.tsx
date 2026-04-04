import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Share2 } from "lucide-react";

export default function DistributionPage() {
  return (
    <PageContainer
      title="Distribution"
      description="Distribute your jobs across multiple channels and job boards."
    >
      <EmptyState
        icon={Share2}
        title="No distribution channels"
        description="Connect job boards and channels to automatically distribute your postings."
        actionLabel="Add Channel"
      />
    </PageContainer>
  );
}
