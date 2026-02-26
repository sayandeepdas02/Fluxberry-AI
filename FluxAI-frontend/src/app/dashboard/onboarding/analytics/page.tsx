"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, Clock, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

interface OnboardingMetrics {
    acceptanceRate: number;
    rejectionRate: number;
    avgTimeToSignDays: number;
    totalOffers: number;
    completionRate: number;
    avgTimeToCompleteDays: number;
    totalOnboardings: number;
    inProgressOnboardings: number;
}

export default function OnboardingAnalyticsPage() {
    const [metrics, setMetrics] = useState<OnboardingMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // To bypass API client for simplicity or if not defined yet
                const res = await fetch('/api/analytics/onboarding', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await res.json();

                if (data.success && data.data) {
                    setMetrics(data.data);
                } else {
                    setError("Failed to load metrics");
                }
            } catch (e) {
                setError("Network error fetching metrics");
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !metrics) {
        return (
            <div className="p-8 text-center text-red-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <h2 className="text-lg font-semibold">Failed to load analytics</h2>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    const funnelData = [
        { name: "Total Offers", value: metrics.totalOffers },
        { name: "Accepted", value: Math.round(metrics.totalOffers * (metrics.acceptanceRate / 100)) },
        { name: "Completed Onboarding", value: Math.round(metrics.totalOnboardings * (metrics.completionRate / 100)) }
    ];

    const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Green, Red, Yellow
    const pieData = [
        { name: "Accepted", value: metrics.acceptanceRate },
        { name: "Rejected", value: metrics.rejectionRate },
        { name: "Pending", value: Math.max(0, 100 - metrics.acceptanceRate - metrics.rejectionRate) },
    ];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Onboarding Analytics</h1>
                <p className="text-muted-foreground mt-2">
                    Review candidate conversion and onboarding speed metrics.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.acceptanceRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Out of {metrics.totalOffers} total offers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Sign Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgTimeToSignDays} Days</div>
                        <p className="text-xs text-muted-foreground mt-1">From send to signature</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.completionRate}%</div>
                        <p className="text-xs text-muted-foreground mt-1">Out of {metrics.totalOnboardings} candidates</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Onboard Time</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.avgTimeToCompleteDays} Days</div>
                        <p className="text-xs text-muted-foreground mt-1">From start to completion</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Conversion Funnel</CardTitle>
                        <CardDescription>From offer extended to fully onboarded</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Offer Outcomes</CardTitle>
                        <CardDescription>Breakdown of offer statuses</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => `${val}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
