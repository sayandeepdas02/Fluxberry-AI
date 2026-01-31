"use client"

import { KPICard } from "@/features/dashboard/components/kpi-card"
import { LineChart } from "@/features/dashboard/components/line-chart"
import { HorizontalBarChart } from "@/features/dashboard/components/horizontal-bar-chart"
import { VerticalBarChart } from "@/features/dashboard/components/vertical-bar-chart"
import { DonutChart } from "@/features/dashboard/components/donut-chart"

// Analytics-specific mock data
const kpiData = {
    totalReach: { value: 24500, label: "Total Reach", trend: { direction: 'up', percentage: 18 } },
    engagedCandidates: { value: 3200, label: "Engaged Candidates", trend: { direction: 'up', percentage: 12 } },
    campaignROI: { value: 285, label: "Campaign ROI %", trend: { direction: 'up', percentage: 5 } },
    avgTimeOnPage: { value: "2m 45s", label: "Avg Time on Page", trend: { direction: 'down', percentage: 2 } },
}

const engagementTrendData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    thisYear: [5000, 8500, 12000, 15000, 18500, 24500], // Representing views/reach
    lastYear: [800, 1200, 1800, 2100, 2600, 3200],     // Representing items
}

const campaignPerformanceData = [
    { name: 'Senior Dev Outreach', value: 45 },
    { name: 'Q1 Hiring Drive', value: 30 },
    { name: 'University Mixer', value: 15 },
    { name: 'Tech Talk Series', value: 8 },
    { name: 'Other', value: 2 },
]

const deviceTrafficData = [
    { device: 'Desktop', count: 15200 },
    { device: 'Mobile', count: 8200 },
    { device: 'Tablet', count: 1100 },
]

const locationTrafficData = [
    { country: 'United States', percentage: 45 },
    { country: 'United Kingdom', percentage: 25 },
    { country: 'Germany', percentage: 15 },
    { country: 'Canada', percentage: 10 },
    { country: 'Others', percentage: 5 },
]

export function AnalyticsView() {
    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                <span>Flux Hire</span>
                <span>/</span>
                <span>Analytics</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title={kpiData.totalReach.label}
                    value={kpiData.totalReach.value.toLocaleString()}
                    trend={kpiData.totalReach.trend as any}
                />
                <KPICard
                    title={kpiData.engagedCandidates.label}
                    value={kpiData.engagedCandidates.value.toLocaleString()}
                    trend={kpiData.engagedCandidates.trend as any}
                />
                <KPICard
                    title={kpiData.campaignROI.label}
                    value={`${kpiData.campaignROI.value}%`}
                    trend={kpiData.campaignROI.trend as any}
                />
                <KPICard
                    title={kpiData.avgTimeOnPage.label}
                    value={kpiData.avgTimeOnPage.value}
                    trend={kpiData.avgTimeOnPage.trend as any}
                />
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Engagement Trend (Line Chart) */}
                <div className="lg:col-span-2">
                    <LineChart
                        data={engagementTrendData}
                    />
                </div>

                {/* Campaign Performance (Horizontal Bar) */}
                <div className="lg:col-span-1">
                    <HorizontalBarChart
                        data={campaignPerformanceData}
                    />
                </div>
            </div>

            {/* Secondary Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <VerticalBarChart data={deviceTrafficData} />
                </div>
                <div className="lg:col-span-1">
                    <DonutChart data={locationTrafficData} />
                </div>
            </div>

        </div>
    )
}
