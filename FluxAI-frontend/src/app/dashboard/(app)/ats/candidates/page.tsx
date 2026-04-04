import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { UserCheck } from "lucide-react";

export default function AllCandidatesPage() {
  return (
    <PageContainer
      title="All Candidates"
      description="View all candidates across every job and pipeline stage."
    >
      <EmptyState
        icon={UserCheck}
        title="No candidates in ATS"
        description="Candidates will appear here once they enter your applicant tracking system."
      />
    </PageContainer>
  );
}
