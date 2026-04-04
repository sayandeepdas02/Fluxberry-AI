import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Gift } from "lucide-react";

export default function ReferralsPage() {
  return (
    <PageContainer
      title="Referrals"
      description="Manage your employee referral program and track referral hires."
    >
      <EmptyState
        icon={Gift}
        title="No referrals yet"
        description="Set up your referral program to start tracking employee referrals."
        actionLabel="Set Up Referrals"
      />
    </PageContainer>
  );
}
