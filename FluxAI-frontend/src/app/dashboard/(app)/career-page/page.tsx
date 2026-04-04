import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Globe } from "lucide-react";

export default function CareerPageView() {
  return (
    <PageContainer
      title="Public Career Page"
      description="Customize your public career page for potential candidates."
    >
      <EmptyState
        icon={Globe}
        title="Career page not configured"
        description="Set up your public career page to showcase your company culture and open positions."
        actionLabel="Configure Career Page"
      />
    </PageContainer>
  );
}
