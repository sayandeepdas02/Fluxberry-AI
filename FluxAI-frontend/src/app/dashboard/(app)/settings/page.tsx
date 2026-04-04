"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Skeleton } from "@/components/dashboard/skeleton"
import { Settings, Users, Building2, Loader2 } from "lucide-react"

interface Organization {
    _id: string
    name: string
    slug: string
    plan?: string
    memberCount?: number
    createdAt: string
}

export default function SettingsPage() {
    const { data: response, isLoading } = useQuery({
        queryKey: ['organization-settings'],
        queryFn: () => apiClient.get<Organization>('/organization'),
    })

    const org = response?.data

    return (
        <PageContainer title="Settings" description="Manage your workspace settings, team members, and preferences.">
            <div className="mt-6 w-full max-w-2xl space-y-6">
                {isLoading && (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                        <Skeleton className="h-16 w-full rounded-lg" />
                    </div>
                )}

                {!isLoading && org && (
                    <>
                        {/* Organization details */}
                        <div className="border border-line rounded-lg bg-card/50 p-6 space-y-4">
                            <h3 className="text-sm font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-accent" /> Organization</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Name</p>
                                    <p className="text-sm font-medium mt-0.5">{org.name}</p>
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Slug</p>
                                    <p className="text-sm font-medium mt-0.5">{org.slug}</p>
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Plan</p>
                                    <Badge className="text-xs bg-accent/10 text-accent mt-1">{org.plan || 'Free'}</Badge>
                                </div>
                                <div className="p-3 bg-muted/20 rounded-lg">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Created</p>
                                    <p className="text-sm text-text-secondary mt-0.5">{new Date(org.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border border-line rounded-lg bg-card/50 p-6 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4 text-accent" /> Team</h3>
                            <p className="text-xs text-muted-foreground">Team management coming soon. You can invite members via the organization settings in your admin panel.</p>
                        </div>

                        <div className="border border-line rounded-lg bg-card/50 p-6 space-y-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4 text-accent" /> Preferences</h3>
                            <p className="text-xs text-muted-foreground">Notification preferences, workflow settings, and integrations will be available here.</p>
                        </div>
                    </>
                )}

                {!isLoading && !org && (
                    <EmptyState
                        icon={Settings}
                        title="Settings"
                        description="Unable to load organization settings. Please try refreshing."
                    />
                )}
            </div>
        </PageContainer>
    )
}
