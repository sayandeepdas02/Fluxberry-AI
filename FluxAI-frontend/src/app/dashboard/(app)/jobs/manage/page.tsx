import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Briefcase } from "lucide-react";

export default function ManageJobsPage() {
  return (
    <PageContainer
      title="Manage Jobs"
      description="View, edit, and manage all your job postings."
    >
      <EmptyState
        icon={Briefcase}
        title="No jobs posted yet"
        description="Create your first job posting to start attracting candidates."
        actionLabel="Create New Job"
      />
    </PageContainer>
  );
}
