import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ArrowRightCircle } from "lucide-react";

export default function JoiningPipelinePage() {
  return (
    <PageContainer
      title="Joining Pipeline"
      description="Track new hires through the joining and onboarding process."
    >
      <EmptyState
        icon={ArrowRightCircle}
        title="No new hires in pipeline"
        description="Accepted candidates will appear here as they progress through the onboarding pipeline."
      />
    </PageContainer>
  );
}
