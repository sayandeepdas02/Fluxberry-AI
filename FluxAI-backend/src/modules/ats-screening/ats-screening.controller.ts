import { Request, Response } from 'express'
import { atsScreeningService } from './ats-screening.service.js'
import { ScreeningResult, ScreeningStatus, deriveStatusPriority } from './models/screening-result.model.js'
import { enqueueAtsScreeningJob } from '../../jobs/queues/index.js'

interface AuthRequest extends Request {
    user?: {
        _id: string
        organizationId: string
    }
}

export class AtsScreeningController {
    async getJobStats(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const stats = await atsScreeningService.getJobScreeningStats(jobId, orgId)
            res.json({ success: true, ...stats })
        } catch (error) {
            console.error('[AtsScreening] getJobStats error:', error)
            res.status(500).json({ success: false, error: 'Failed to fetch ATS screening stats' })
        }
    }

    async getCandidatesList(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20

            // Extract filter params
            const filters: {
                search?: string
                decision?: string
                scoreMin?: number
                scoreMax?: number
            } = {}

            if (req.query.search) filters.search = req.query.search as string
            if (req.query.decision) filters.decision = req.query.decision as string
            if (req.query.scoreMin) filters.scoreMin = parseInt(req.query.scoreMin as string)
            if (req.query.scoreMax) filters.scoreMax = parseInt(req.query.scoreMax as string)

            const result = await atsScreeningService.getCandidatesList(jobId, orgId, page, limit, filters)
            res.json({ success: true, ...result })
        } catch (error: any) {
            console.error('[AtsScreening] getCandidatesList error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch tracking list' })
        }
    }

    async getCandidateBreakdown(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId, candidateId } = req.params

            const breakdown = await atsScreeningService.getCandidateBreakdown(jobId, candidateId, orgId)
            res.json({ success: true, breakdown })
        } catch (error: any) {
            console.error('[AtsScreening] getCandidateBreakdown error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch breakdown' })
        }
    }

    async getJobProfile(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const profile = await atsScreeningService.getJobProfile(jobId, orgId)
            res.json({ success: true, profile })
        } catch (error: any) {
            console.error('[AtsScreening] getJobProfile error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to fetch job profile' })
        }
    }

    async updateJobProfile(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params
            const updateData = req.body

            const profile = await atsScreeningService.updateJobProfile(jobId, orgId, updateData)
            res.json({ success: true, profile })
        } catch (error: any) {
            console.error('[AtsScreening] updateJobProfile error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to update job profile' })
        }
    }

    // ─── Part 1: Weights ────────────────────────────────────────

    async getWeights(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const weights = await atsScreeningService.getWeights(jobId, orgId)
            res.json({ success: true, weights })
        } catch (error: any) {
            console.error('[AtsScreening] getWeights error:', error)
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch weights' })
        }
    }

    async updateWeights(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const weights = await atsScreeningService.updateWeights(jobId, orgId, req.body)
            res.json({ success: true, weights })
        } catch (error: any) {
            console.error('[AtsScreening] updateWeights error:', error)
            const status = error.code === 'VALIDATION' ? 400 : 500
            res.status(status).json({ success: false, error: error.message || 'Failed to update weights' })
        }
    }

    // ─── Part 5: Feedback ───────────────────────────────────────

    async getFeedbackSummary(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId } = req.params

            const summary = await atsScreeningService.getFeedbackSummary(jobId, orgId)
            res.json({ success: true, summary })
        } catch (error: any) {
            console.error('[AtsScreening] getFeedbackSummary error:', error)
            res.status(500).json({ success: false, error: error.message || 'Failed to fetch feedback summary' })
        }
    }

    // ─── Existing: Override ─────────────────────────────────────

    async overrideDecision(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const userId = req.user!._id
            const { jobId, candidateId } = req.params
            const { decision, reason } = req.body

            if (!['SHORTLISTED', 'REVIEW', 'REJECTED'].includes(decision)) {
                return res.status(400).json({ success: false, error: 'Invalid decision' })
            }

            const result = await atsScreeningService.overrideDecision(jobId, candidateId, orgId, userId, decision, reason || 'Manual override')
            res.json({ success: true, result })
        } catch (error: any) {
            console.error('[AtsScreening] overrideDecision error:', error)
            res.status(error.code === 'NOT_FOUND' ? 404 : 500).json({ success: false, error: error.message || 'Failed to override decision' })
        }
    }

    // ─── Existing: Bulk Override ────────────────────────────────

    async bulkOverride(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const userId = req.user!._id
            const { jobId } = req.params
            const { candidateIds, decision, reason } = req.body

            if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
                return res.status(400).json({ success: false, error: 'candidateIds must be a non-empty array' })
            }

            if (!['SHORTLISTED', 'REVIEW', 'REJECTED'].includes(decision)) {
                return res.status(400).json({ success: false, error: 'Invalid decision' })
            }

            const results = []
            const errors = []

            for (const candidateId of candidateIds) {
                try {
                    await atsScreeningService.overrideDecision(
                        jobId, candidateId, orgId, userId,
                        decision, reason || `Bulk ${decision.toLowerCase()}`
                    )
                    results.push({ candidateId, success: true })
                } catch (err: any) {
                    errors.push({ candidateId, error: err.message || 'Failed' })
                }
            }

            res.json({
                success: true,
                processed: results.length,
                failed: errors.length,
                results,
                errors,
            })
        } catch (error: any) {
            console.error('[AtsScreening] bulkOverride error:', error)
            res.status(500).json({ success: false, error: error.message || 'Failed to process bulk override' })
        }
    }

    // ─── Existing: Retry ────────────────────────────────────────

    async retryParseFailed(req: AuthRequest, res: Response) {
        try {
            const orgId = req.user!.organizationId
            const { jobId, candidateId } = req.params

            const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
            if (!result) {
                return res.status(404).json({ success: false, error: 'Screening result not found' })
            }

            if (result.status !== ScreeningStatus.PARSE_FAILED && result.status !== ScreeningStatus.ERROR) {
                return res.status(400).json({
                    success: false,
                    error: `Cannot retry: candidate is in '${result.status}' state. Only PARSE_FAILED or ERROR candidates can be retried.`
                })
            }

            // Reset to AWAITING_PARSE so the worker knows to check again
            await ScreeningResult.findOneAndUpdate(
                { candidateId, jobId, organizationId: orgId },
                {
                    $set: {
                        status:         ScreeningStatus.AWAITING_PARSE,
                        errorReason:    null,
                        statusPriority: deriveStatusPriority(ScreeningStatus.AWAITING_PARSE),
                    },
                    $unset: { hardGateFailureReason: '' }
                }
            )

            // Re-enqueue screening job — BullMQ deduplication handles if already queued
            await enqueueAtsScreeningJob({
                type: 'CANDIDATE_APPLIED',
                applicationId: (result as any).applicationId || candidateId,
                candidateId,
                jobId,
                organizationId: orgId,
            })

            console.log(`[ATS] Manual retry triggered for candidate=${candidateId} job=${jobId} by user=${req.user!._id}`)
            res.json({ success: true, message: 'Screening job re-queued. Results will update shortly.' })
        } catch (error: any) {
            console.error('[AtsScreening] retryParseFailed error:', error)
            res.status(500).json({ success: false, error: error.message || 'Failed to retry screening' })
        }
    }
}

export const atsScreeningController = new AtsScreeningController()
