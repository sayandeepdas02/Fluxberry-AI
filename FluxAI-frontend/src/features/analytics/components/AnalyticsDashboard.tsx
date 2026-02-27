
"use client"

import { useEffect, useState } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell
} from "recharts"
import {
    analyticsApi,
    AnalyticsKPIResponse,
    AnalyticsTrendData,
    AnalyticsFunnelResponse,
    AnalyticsTimeToHireResponse,
    AtsEfficiencyResponse,
    DemographicsData
} from "@/lib/api/analytics"
import { jobsApi, Job } from "@/lib/api/jobs"
import { Users, FileText, CheckCircle, Clock, TrendingUp, Zap } from "lucide-react"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard() {
    const [jobs, setJobs] = useState<Job[]>([])
    const [selectedJob, setSelectedJob] = useState<string>("all")
    const [timeframe, setTimeframe] = useState<'week' | 'month'>('month')

    // Data States
    const [kpis, setKpis] = useState<AnalyticsKPIResponse | null>(null)
    const [trends, setTrends] = useState<AnalyticsTrendData[]>([])
    const [funnel, setFunnel] = useState<AnalyticsFunnelResponse | null>(null)
    const [timeToHire, setTimeToHire] = useState<AnalyticsTimeToHireResponse | null>(null)
    const [demographics, setDemographics] = useState<{ device: DemographicsData[] } | null>(null)
    const [efficiency, setEfficiency] = useState<AtsEfficiencyResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchJobs()
    }, [])

    useEffect(() => {
        fetchAnalytics()
    }, [selectedJob, timeframe])

    const fetchJobs = async () => {
        try {
            const res = await jobsApi.list()
            if (res.success && res.data) {
                setJobs(res.data.jobs)
            }
        } catch (error) {
            console.error("Failed to fetch jobs", error)
        }
    }

    const fetchAnalytics = async () => {
        setLoading(true)
        const jobId = selectedJob === "all" ? undefined : selectedJob
        try {
            const [kpiRes, trendRes, funnelRes, timeRes, demoRes, effRes] = await Promise.all([
                analyticsApi.getKPIs(jobId),
                analyticsApi.getTrends(timeframe, jobId),
                analyticsApi.getFunnel(jobId),
                analyticsApi.getTimeToHire(jobId),
                analyticsApi.getDemographics(jobId),
                analyticsApi.getAtsEfficiency(jobId)
            ])

            if (kpiRes.success && kpiRes.data) setKpis(kpiRes.data)
            if (trendRes.success && trendRes.data) setTrends(trendRes.data)
            if (funnelRes.success && funnelRes.data) setFunnel(funnelRes.data)
            if (timeRes.success && timeRes.data) setTimeToHire(timeRes.data)
            if (demoRes.success && demoRes.data) setDemographics(demoRes.data)
            if (effRes.success && effRes.data) setEfficiency(effRes.data)

        } catch (error) {
            console.error("Failed to fetch analytics", error)
        } finally {
            setLoading(false)
        }
    }

    if (loading && !kpis) {
        return <div className="p-8 flex justify-center">Loading analytics...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">
                        Overview of your hiring pipeline and performance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Timeframe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={selectedJob} onValueChange={setSelectedJob}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Jobs" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Jobs</SelectItem>
                            {jobs.map(job => (
                                <SelectItem key={job._id} value={job._id}>
                                    {job.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Applications"
                    value={kpis?.applications.value || 0}
                    icon={FileText}
                    description="Across all active jobs"
                />
                <KPICard
                    title="Active Candidates"
                    value={kpis?.totalCandidates.value || 0}
                    icon={Users}
                    description="Currently in pipeline"
                />
                <KPICard
                    title="Hired"
                    value={funnel?.stageDistribution['HIRED'] || 0}
                    icon={CheckCircle}
                    description="Successfully hired"
                />
                <KPICard
                    title="Avg Time to Hire"
                    value={`${Math.round(timeToHire?.avgDays || 0)} days`}
                    icon={Clock}
                    description={`Min: ${Math.round(timeToHire?.min || 0)}d, Max: ${Math.round(timeToHire?.max || 0)}d`}
                />
                <KPICard
                    title="Hours Saved (ATS)"
                    value={efficiency?.hoursSaved || 0}
                    icon={Zap}
                    description="Estimated manual screening time saved"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Application Volume Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Application Volume</CardTitle>
                        <CardDescription>
                            Number of applications received over time ({timeframe}).
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trends}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                        }}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                        labelStyle={{ color: 'var(--foreground)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#f97316"
                                        fillOpacity={1}
                                        fill="url(#colorValue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Funnel Chart */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Hiring Funnel</CardTitle>
                        <CardDescription>Conversion from Application to Hire.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={[
                                        { name: 'Applied', value: funnel?.stageDistribution['APPLIED'] || 0 },
                                        { name: 'Bi-Screening', value: funnel?.stageDistribution['SCREENING'] || 0 },
                                        { name: 'Interview', value: funnel?.stageDistribution['INTERVIEW'] || 0 },
                                        { name: 'Offer', value: funnel?.stageDistribution['OFFER_SENT'] || 0 },
                                        { name: 'Hired', value: funnel?.stageDistribution['HIRED'] || 0 },
                                    ]}
                                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        scale="band"
                                        tick={{ fontSize: 12, fill: '#888888' }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                    />
                                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Score Distribution Chart */}
                <Card className="col-span-4 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>ATS Score Distribution</CardTitle>
                        <CardDescription>How candidates are scoring in automated screening.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={efficiency?.scoreDistribution || []}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis
                                        dataKey="range"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        contentStyle={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                    />
                                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40}>
                                        {(efficiency?.scoreDistribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Source Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Source Breakdown</CardTitle>
                        <CardDescription>Where are your candidates coming from?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={demographics?.device || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(demographics?.device || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center mt-4">
                            {(demographics?.device || []).slice(0, 5).map((entry, index) => (
                                <div key={entry.label} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    <span className="text-sm text-muted-foreground">{entry.label} ({entry.percentage}%)</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Conversion Rates Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Conversion Rates</CardTitle>
                        <CardDescription>Efficiency of your hiring process.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8 mt-4">
                            <div className="flex items-center">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Application to Interview</p>
                                    <p className="text-sm text-muted-foreground">Candidates who make it to the interview stage.</p>
                                </div>
                                <div className="font-bold text-2xl">{funnel?.conversionRates.appliedToInterview}%</div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Interview to Offer</p>
                                    <p className="text-sm text-muted-foreground">Interviewed candidates who receive an offer.</p>
                                </div>
                                <div className="font-bold text-2xl">{funnel?.conversionRates.interviewToOffer}%</div>
                            </div>
                            <div className="flex items-center">
                                <div className="flex-1 space-y-1">
                                    <p className="text-sm font-medium leading-none">Offer Acceptance Rate</p>
                                    <p className="text-sm text-muted-foreground">Candidates who accept the offer.</p>
                                </div>
                                <div className="font-bold text-2xl">{funnel?.conversionRates.offerToHired}%</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon: Icon, description }: { title: string, value: string | number, icon: any, description: string }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}
