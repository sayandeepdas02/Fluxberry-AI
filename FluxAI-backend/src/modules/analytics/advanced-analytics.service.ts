/**
 * Advanced Analytics Service
 * Executive-grade analytics: recruiter performance, velocity trends,
 * source quality, cohort analysis, bottleneck heatmaps, forecasting.
 * All methods use MongoDB aggregation pipelines with Redis caching.
 */

import { JobApplication, ApplicationStatus, Candidate, Job as JobModel, StageHistory, Organization } from '../../database/models/index.js'
import { ScreeningResult } from '../ats-screening/models/screening-result.model.js'
import mongoose from 'mongoose'
import Redis from 'ioredis'

const CACHE_TTL = 600 // 10 minutes
let redis: Redis | null = null
try { redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379') } catch { redis = null }

async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (redis) {
        const hit = await redis.get(key).catch(() => null)
        if (hit) return JSON.parse(hit)
    }
    const result = await fn()
    if (redis) redis.setex(key, CACHE_TTL, JSON.stringify(result)).catch(() => {})
    return result
}

class AdvancedAnalyticsService {
    private oid(id: string) { return new mongoose.Types.ObjectId(id) }

    // ── Recruiter Performance ────────────────────────────────
    async getRecruiterPerformance(orgId: string) {
        return cached(`analytics:recruiter:${orgId}`, async () => {
            const pipeline = await JobApplication.aggregate([
                { $match: { organizationId: this.oid(orgId), isDeleted: false } },
                { $group: {
                    _id: '$reviewedBy',
                    reviewed: { $sum: 1 },
                    hired: { $sum: { $cond: [{ $eq: ['$status', ApplicationStatus.HIRED] }, 1, 0] } },
                    rejected: { $sum: { $cond: [{ $eq: ['$status', ApplicationStatus.REJECTED] }, 1, 0] } },
                }},
                { $match: { _id: { $ne: null } } },
                { $sort: { reviewed: -1 } },
                { $limit: 20 },
            ])
            return pipeline
        })
    }

    // ── Hiring Velocity Trends ───────────────────────────────
    async getHiringVelocityTrends(orgId: string, months: number = 6) {
        return cached(`analytics:velocity:${orgId}:${months}`, async () => {
            const startDate = new Date()
            startDate.setMonth(startDate.getMonth() - months)

            const trends = await JobApplication.aggregate([
                { $match: { organizationId: this.oid(orgId), status: ApplicationStatus.HIRED, updatedAt: { $gte: startDate } } },
                { $project: {
                    month: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } },
                    daysToHire: { $divide: [{ $subtract: ['$updatedAt', '$createdAt'] }, 86400000] },
                }},
                { $group: { _id: '$month', hires: { $sum: 1 }, avgDaysToHire: { $avg: '$daysToHire' } } },
                { $sort: { _id: 1 } },
            ])

            return trends.map(t => ({
                month: t._id,
                hires: t.hires,
                avgDaysToHire: Math.round(t.avgDaysToHire * 10) / 10,
            }))
        })
    }

    // ── Source Quality Scoring ────────────────────────────────
    async getSourceQuality(orgId: string) {
        return cached(`analytics:source:${orgId}`, async () => {
            const sources = await Candidate.aggregate([
                { $match: { organizationId: this.oid(orgId), isDeleted: false } },
                { $group: { _id: '$source', total: { $sum: 1 } } },
                { $sort: { total: -1 } },
            ])

            // Enrich with hire rate per source
            const enriched = await Promise.all(sources.map(async (s) => {
                const [apps, hired] = await Promise.all([
                    JobApplication.countDocuments({ organizationId: this.oid(orgId), source: s._id }),
                    JobApplication.countDocuments({ organizationId: this.oid(orgId), source: s._id, status: ApplicationStatus.HIRED }),
                ])
                return {
                    source: s._id || 'unknown',
                    totalCandidates: s.total,
                    applications: apps,
                    hires: hired,
                    hireRate: apps > 0 ? Math.round((hired / apps) * 100) : 0,
                }
            }))

            return enriched
        })
    }

    // ── Funnel Conversion Detailed ───────────────────────────
    async getDetailedFunnel(orgId: string, jobId?: string) {
        return cached(`analytics:funnel:${orgId}:${jobId || 'all'}`, async () => {
            const match: any = { organizationId: this.oid(orgId), isDeleted: false }
            if (jobId) match.jobId = this.oid(jobId)

            const stages = Object.values(ApplicationStatus)
            const counts: Record<string, number> = {}

            for (const stage of stages) {
                counts[stage] = await JobApplication.countDocuments({ ...match, status: stage })
            }

            const total = Object.values(counts).reduce((a, b) => a + b, 0)
            const funnel = stages.map(stage => ({
                stage,
                count: counts[stage],
                percentage: total > 0 ? Math.round((counts[stage] / total) * 100) : 0,
            })).filter(s => s.count > 0)

            return { total, funnel }
        })
    }

    // ── Stage Dropoff Analysis ───────────────────────────────
    async getStageDropoff(orgId: string, jobId?: string) {
        return cached(`analytics:dropoff:${orgId}:${jobId || 'all'}`, async () => {
            const match: any = { organizationId: this.oid(orgId) }
            if (jobId) match.jobId = this.oid(jobId)

            const stageFlow = await StageHistory.aggregate([
                { $match: match },
                { $group: { _id: { from: '$fromStage', to: '$toStage' }, count: { $sum: 1 }, avgTimeMs: { $avg: '$timeInStageMs' } } },
                { $sort: { count: -1 } },
            ])

            return stageFlow.map(s => ({
                fromStage: s._id.from,
                toStage: s._id.to,
                transitions: s.count,
                avgTimeInStageHours: Math.round((s.avgTimeMs / 3600000) * 10) / 10,
            }))
        })
    }

    // ── Offer Acceptance Analytics ────────────────────────────
    async getOfferAcceptance(orgId: string) {
        return cached(`analytics:offers:${orgId}`, async () => {
            const [sent, accepted, rejected] = await Promise.all([
                JobApplication.countDocuments({ organizationId: this.oid(orgId), status: ApplicationStatus.OFFER_SENT }),
                JobApplication.countDocuments({ organizationId: this.oid(orgId), status: ApplicationStatus.OFFER_ACCEPTED }),
                JobApplication.countDocuments({ organizationId: this.oid(orgId), status: ApplicationStatus.REJECTED, 'stageHistory.fromStage': ApplicationStatus.OFFER_SENT }),
            ])
            const total = sent + accepted + rejected
            return {
                offersSent: total,
                accepted,
                pending: sent,
                declined: rejected,
                acceptanceRate: total > 0 ? Math.round((accepted / total) * 100) : 0,
            }
        })
    }

    // ── Bottleneck Heatmap ───────────────────────────────────
    async getBottleneckHeatmap(orgId: string) {
        return cached(`analytics:heatmap:${orgId}`, async () => {
            const jobs = await JobModel.find({ organizationId: this.oid(orgId), status: 'PUBLISHED', deletedAt: null })
                .select('title').limit(20).lean()

            const heatmap = await Promise.all(jobs.map(async (job) => {
                const stageStats = await StageHistory.aggregate([
                    { $match: { jobId: (job as any)._id } },
                    { $match: { timeInStageMs: { $gt: 0 } } },
                    { $group: { _id: '$fromStage', avgMs: { $avg: '$timeInStageMs' }, count: { $sum: 1 } } },
                ])

                return {
                    jobId: (job as any)._id,
                    jobTitle: (job as any).title,
                    stages: stageStats.map(s => ({
                        stage: s._id,
                        avgHours: Math.round((s.avgMs / 3600000) * 10) / 10,
                        count: s.count,
                    })),
                }
            }))

            return heatmap
        })
    }

    // ── Hiring Forecast ──────────────────────────────────────
    async getHiringForecast(orgId: string) {
        return cached(`analytics:forecast:${orgId}`, async () => {
            const threeMonthsAgo = new Date()
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

            const monthlyHires = await JobApplication.aggregate([
                { $match: { organizationId: this.oid(orgId), status: ApplicationStatus.HIRED, updatedAt: { $gte: threeMonthsAgo } } },
                { $project: { month: { $dateToString: { format: '%Y-%m', date: '$updatedAt' } } } },
                { $group: { _id: '$month', count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ])

            const avgMonthlyHires = monthlyHires.length > 0
                ? Math.round(monthlyHires.reduce((a, b) => a + b.count, 0) / monthlyHires.length)
                : 0

            const openPositions = await JobModel.countDocuments({ organizationId: this.oid(orgId), status: 'PUBLISHED', deletedAt: null })
            const inPipeline = await JobApplication.countDocuments({
                organizationId: this.oid(orgId),
                status: { $nin: [ApplicationStatus.HIRED, ApplicationStatus.REJECTED] },
                isDeleted: false,
            })

            return {
                avgMonthlyHires,
                openPositions,
                inPipeline,
                forecastedMonthsToFill: avgMonthlyHires > 0 ? Math.ceil(openPositions / avgMonthlyHires) : null,
                historicalTrend: monthlyHires,
                confidence: monthlyHires.length >= 3 ? 'high' : monthlyHires.length >= 1 ? 'medium' : 'low',
            }
        })
    }
}

export const advancedAnalyticsService = new AdvancedAnalyticsService()
