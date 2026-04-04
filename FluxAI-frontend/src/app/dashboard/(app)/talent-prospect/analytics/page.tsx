"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { prospectsApi } from "@/lib/api/prospects"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { LineChart, BarChart2, Mail, Users, TrendingUp } from "lucide-react"

export default function ProspectAnalyticsPage() {
    const { data: campaignsRes, isLoading: bgLoading } = useQuery({
        queryKey: ['campaigns-analytics'],
        queryFn: () => prospectsApi.listCampaigns(),
    })

    const campaigns = campaignsRes?.data || []
    
    const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0)
    const totalOpened = campaigns.reduce((acc, c) => acc + (c.stats?.opened || 0), 0)
    const totalReplied = campaigns.reduce((acc, c) => acc + (c.stats?.replied || 0), 0)

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0"
    const replyRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : "0.0"

    return (
        <PageContainer title="Prospect Analytics" description="Track outreach performance, response rates, and prospect engagement.">
            <div className="mt-6 w-full space-y-6">
                {bgLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                )}

                {!bgLoading && campaigns.length === 0 && (
                    <EmptyState
                        icon={LineChart}
                        title="No outreach data yet"
                        description="Analytics will populate once you start running outreach campaigns."
                    />
                )}

                {!bgLoading && campaigns.length > 0 && (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 border border-line rounded-lg bg-card/50">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Sent</p>
                                <p className="text-2xl font-bold">{totalSent}</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Opened</p>
                                <p className="text-2xl font-bold">{totalOpened}</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Open Rate</p>
                                <p className="text-2xl font-bold text-emerald-400">{openRate}%</p>
                            </div>
                            <div className="p-4 border border-line rounded-lg bg-card/50">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-accent" /> Reply Rate</p>
                                <p className="text-2xl font-bold text-accent">{replyRate}%</p>
                            </div>
                        </div>

                        <div className="border border-line rounded-lg bg-card/50 p-6">
                            <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><BarChart2 className="w-4 h-4 text-accent" /> Campaign Performance</h3>
                            <div className="space-y-3">
                                {campaigns.filter(c => c.status !== 'draft').map(c => (
                                    <div key={c._id} className="p-3 border border-line rounded-lg bg-card">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{c.name}</p>
                                            <span className="text-xs text-muted-foreground">{c.status}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>Sent: {c.stats?.sent || 0}</span>
                                            <span>Opened: {c.stats?.opened || 0}</span>
                                            <span>Replied: {c.stats?.replied || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </PageContainer>
    )
}
