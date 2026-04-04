import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PlusCircle } from "lucide-react";

export default function CreateJobPage() {
  return (
    <PageContainer
      title="Create Job"
      description="Create a new job posting and start receiving applications."
    >
      <EmptyState
        icon={PlusCircle}
        title="Create a new job"
        description="Fill in the job details, requirements, and preferences to publish your listing."
        actionLabel="Start Creating"
      />
    </PageContainer>
  );
}
