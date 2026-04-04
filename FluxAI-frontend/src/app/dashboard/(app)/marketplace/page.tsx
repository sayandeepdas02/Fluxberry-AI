import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { LayoutGrid } from "lucide-react";

export default function MarketplacePage() {
  return (
    <PageContainer
      title="OS Marketplace"
      description="Discover and install integrations, extensions, and tools."
    >
      <EmptyState
        icon={LayoutGrid}
        title="Marketplace"
        description="Browse integrations and tools to extend your Flexberry AI platform capabilities."
        actionLabel="Browse Apps"
      />
    </PageContainer>
  );
}
