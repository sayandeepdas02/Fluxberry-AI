"use client";

import { KPICard } from "@/features/dashboard/components/kpi-card";
import { LineChart } from "@/features/dashboard/components/line-chart";
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart";
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart";
import { DonutChart } from "@/features/dashboard/components/donut-chart";
import { kpiData, hiringActivityData, applicationSourcesData, trafficByDeviceData, trafficByLocationData } from "@/features/dashboard/mocks/dashboard";

export function DashboardOverview() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Content Top Padding if needed, or just start Grid */}

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Active Jobs"
                        value={kpiData.activeJobs.value}
                        trend={kpiData.activeJobs.trend}
                    />
                    <KPICard
                        title="Total Candidates"
                        value={kpiData.totalCandidates.value}
                        trend={kpiData.totalCandidates.trend}
                    />
                    <KPICard
                        title="Applications"
                        value={kpiData.applications.value}
                        trend={kpiData.applications.trend}
                    />
                    <KPICard
                        title="Candidates Awaiting Reviews"
                        value={kpiData.candidatesAwaitingReview.value}
                        trend={kpiData.candidatesAwaitingReview.trend}
                    />
                </div>

                {/* Middle Section: Trends + Sources */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Hiring Activity / Total Users Trend - Spans 2 cols */}
                    <div className="lg:col-span-2">
                        <LineChart data={hiringActivityData} />
                    </div>

                    {/* Application Sources - Spans 1 col */}
                    <div className="lg:col-span-1 h-full">
                        <HorizontalBarChart data={applicationSourcesData} />
                    </div>
                </div>

                {/* Lower Section: Device Traffic + Location */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Traffic by Device - Spans 2 cols */}
                    <div className="lg:col-span-2">
                        <VerticalBarChart data={trafficByDeviceData} />
                    </div>

                    {/* Traffic by Location - Spans 1 col */}
                    <div className="lg:col-span-1">
                        <DonutChart data={trafficByLocationData} />
                    </div>
                </div>
            </div>
        </div>
    );
}
