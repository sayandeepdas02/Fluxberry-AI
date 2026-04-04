"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { EmptyState } from "@/components/dashboard/empty-state"
import { LayoutGrid } from "lucide-react"

export default function MarketplacePage() {
    // Just a placeholder check to ensure the page can connect to APIs
    const { data: response, isLoading } = useQuery({
        queryKey: ['marketplace-apps'],
        queryFn: () => apiClient.get('/api/apps').catch(() => ({ data: [] })),
    })

    return (
        <PageContainer title="OS Marketplace" description="Discover and install integrations, extensions, and tools.">
            <div className="mt-6 w-full">
                <EmptyState
                    icon={LayoutGrid}
                    title="Marketplace coming soon"
                    description="Browse integrations and tools to extend your Flexberry AI platform capabilities."
                    actionLabel="View Waitlist"
                />
            </div>
        </PageContainer>
    )
}
