import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ClipboardList } from "lucide-react";

export default function ScorecardsPage() {
  return (
    <PageContainer
      title="Scorecards"
      description="Create and manage interview scorecards for structured evaluations."
    >
      <EmptyState
        icon={ClipboardList}
        title="No scorecards created"
        description="Create scorecards to standardize your interview evaluation process."
        actionLabel="Create Scorecard"
      />
    </PageContainer>
  );
}
