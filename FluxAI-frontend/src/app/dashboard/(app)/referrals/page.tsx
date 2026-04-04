"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { candidatesApi } from "@/lib/api/candidates"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { Gift, Users, Coins } from "lucide-react"

export default function ReferralsPage() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['candidates', 'referrals'],
        queryFn: () => candidatesApi.list({ source: 'referral', limit: 20 }),
    })

    const referrals = response?.data || []
    
    return (
        <PageContainer title="Referrals" description="Manage your employee referral program and track referral hires.">
            <div className="mt-6 w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 border border-line rounded-lg bg-card/50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Total Referrals</p>
                            <p className="text-xl font-bold">{referrals.length}</p>
                        </div>
                    </div>
                    <div className="p-4 border border-line rounded-lg bg-card/50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Gift className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Successful Hires</p>
                            <p className="text-xl font-bold">0</p>
                        </div>
                    </div>
                    <div className="p-4 border border-line rounded-lg bg-card/50 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <Coins className="w-5 h-5 text-yellow-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Rewards Pending</p>
                            <p className="text-xl font-bold">$0</p>
                        </div>
                    </div>
                </div>

                {isLoading && (
                    <div className="space-y-3">
                        <Skeleton className="h-20 w-full rounded-lg" />
                    </div>
                )}

                {!isLoading && referrals.length === 0 && (
                    <EmptyState
                        icon={Gift}
                        title="No referrals yet"
                        description="Set up your referral program to start tracking employee referrals."
                        actionLabel="Set Up Referrals"
                    />
                )}

                {!isLoading && referrals.length > 0 && (
                    <div className="border border-line rounded-lg bg-card/50 p-4 space-y-3">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Referrals</h4>
                        {referrals.map(candidate => (
                            <div key={candidate._id} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">{candidate.firstName} {candidate.lastName}</p>
                                    <p className="text-[10px] text-muted-foreground">{candidate.email}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">In Review</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
