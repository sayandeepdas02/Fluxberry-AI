'use client'

import { OfferList } from "@/features/offers/components/offer-list";
import { CreateOfferModal } from "@/features/offers/components/create-offer-modal";

export default function OffersPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Offers</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create, send, and track candidate offers.
                        </p>
                    </div>
                    <CreateOfferModal />
                </div>

                {/* Content */}
                <OfferList />
            </div>
        </div>
    );
}
