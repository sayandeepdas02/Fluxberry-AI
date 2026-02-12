import { Job } from 'bullmq'
import { JobApplication, Job as JobModel } from '../../database/models/index.js'

export interface AnalyticsAggregationJobData {
    type: 'AGGREGATE_PIPELINE_METRICS' | 'AGGREGATE_ORG_METRICS'
    organizationId: string
    jobId?: string
    period?: 'daily' | 'weekly' | 'monthly'
}

/**
 * Analytics aggregation processor — computes pipeline metrics
 */
export async function processAnalyticsAggregationJob(job: Job<AnalyticsAggregationJobData>): Promise<void> {
    const { type, organizationId, jobId, period = 'daily' } = job.data
    console.log(`[Analytics] Aggregating ${type} for org ${organizationId}`)

    try {
        if (type === 'AGGREGATE_PIPELINE_METRICS' && jobId) {
            // Aggregate stage distribution for a specific job
            const pipeline = await JobApplication.aggregate([
                { $match: { jobId: new (await import('mongoose')).default.Types.ObjectId(jobId), deletedAt: null } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ])

            console.log(`[Analytics] ✅ Pipeline metrics for job ${jobId}:`, pipeline)
            // In production, store to AnalyticsSnapshot model
        } else if (type === 'AGGREGATE_ORG_METRICS') {
            // Aggregate org-wide metrics
            const [totalJobs, totalApplications] = await Promise.all([
                JobModel.countDocuments({ organizationId, deletedAt: null }),
                JobApplication.countDocuments({ organizationId, deletedAt: null }),
            ])

            console.log(`[Analytics] ✅ Org metrics — Jobs: ${totalJobs}, Applications: ${totalApplications}`)
            // In production, store to AnalyticsSnapshot model
        }
    } catch (err) {
        console.error(`[Analytics] ❌ Failed for org ${organizationId}:`, err)
        throw err
    }
}
