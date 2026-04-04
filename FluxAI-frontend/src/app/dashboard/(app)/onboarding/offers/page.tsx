"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { OfferList } from "@/features/offers/components/offer-list"
import { Plus } from "lucide-react"

export default function OffersPage() {
    return (
        <PageContainer title="Offers" description="Create, send, and track offer letters to candidates.">
            <div className="mt-6 w-full flex flex-col space-y-4">
                <div className="flex items-center justify-end">
                    <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity">
                        <Plus className="w-4 h-4" /> Create Offer
                    </button>
                </div>
                <div className="bg-card w-full">
                    <OfferList />
                </div>
            </div>
        </PageContainer>
    )
}
