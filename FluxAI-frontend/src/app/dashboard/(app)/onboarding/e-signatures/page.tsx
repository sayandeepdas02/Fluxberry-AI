"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { PenTool, FileText } from "lucide-react"
import { format } from "date-fns"

export default function ESignaturesPage() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['onboarding-signatures'],
        queryFn: () => apiClient.get<any[]>('/onboarding', { type: 'ESIGNATURE' }).catch(() => ({ data: [] })),
    })

    const documents = response?.data || []

    return (
        <PageContainer title="E-Signatures" description="Manage digital signatures for offer letters and documents.">
            <div className="mt-6 w-full space-y-6">
                {isLoading && (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                )}

                {!isLoading && documents.length === 0 && (
                    <EmptyState
                        icon={PenTool}
                        title="No documents pending signature"
                        description="Documents requiring e-signatures will appear here once offers are sent."
                    />
                )}

                {!isLoading && documents.length > 0 && (
                    <div className="space-y-3">
                        {documents.map((doc: any) => (
                            <div key={doc._id} className="flex items-center justify-between p-4 border border-line rounded-lg bg-card/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{doc.title}</p>
                                        <p className="text-[10px] text-muted-foreground">Sent to {doc.candidateEmail}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full">Pending Signature</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
