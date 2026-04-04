import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { HandCoins } from "lucide-react";

export default function OffersPage() {
  return (
    <PageContainer
      title="Offers"
      description="Create, send, and track offer letters to candidates."
    >
      <EmptyState
        icon={HandCoins}
        title="No offers sent"
        description="Create and send offer letters to finalize hiring decisions."
        actionLabel="Create Offer"
      />
    </PageContainer>
  );
}
