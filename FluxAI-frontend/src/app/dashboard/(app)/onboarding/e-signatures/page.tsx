import { PageContainer } from "@/components/dashboard/page-container";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PenTool } from "lucide-react";

export default function ESignaturesPage() {
  return (
    <PageContainer
      title="E-Signatures"
      description="Manage digital signatures for offer letters and documents."
    >
      <EmptyState
        icon={PenTool}
        title="No documents pending signature"
        description="Documents requiring e-signatures will appear here once offers are sent."
      />
    </PageContainer>
  );
}
