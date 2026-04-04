import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <PageContainer
      title="Settings"
      description="Manage your workspace settings, team members, and preferences."
    >
      <EmptyState
        icon={Settings}
        title="Settings"
        description="Configure your workspace, manage team members, and customize your Flexberry AI platform."
        actionLabel="Get Started"
      />
    </PageContainer>
  );
}
