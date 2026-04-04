import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Zap } from "lucide-react";

export default function AutomationsPage() {
  return (
    <PageContainer
      title="Automations"
      description="Automate repetitive hiring tasks with workflow automation."
    >
      <EmptyState
        icon={Zap}
        title="No automations set up"
        description="Create automations to streamline candidate screening, email follow-ups, and stage transitions."
        actionLabel="Create Automation"
      />
    </PageContainer>
  );
}
