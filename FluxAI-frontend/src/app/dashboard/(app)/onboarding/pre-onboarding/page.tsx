import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FileText } from "lucide-react";

export default function PreOnboardingPage() {
  return (
    <PageContainer
      title="Pre-Onboarding"
      description="Prepare new hires with pre-onboarding tasks and documentation."
    >
      <EmptyState
        icon={FileText}
        title="No pre-onboarding tasks"
        description="Set up pre-onboarding workflows to prepare new hires before their start date."
        actionLabel="Create Workflow"
      />
    </PageContainer>
  );
}
