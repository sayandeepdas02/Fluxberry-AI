import { Response, NextFunction } from 'express'
import { atsScreeningService } from './ats-screening.service.js'
import { ScreeningResult, ScreeningStatus, deriveStatusPriority } from './models/screening-result.model.js'
import { enqueueAtsScreeningJob } from '../../jobs/queues/index.js'
import { Candidate } from '../../database/models/index.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class AtsScreeningController {
    async getJobStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const stats = await atsScreeningService.getJobScreeningStats(req.params.jobId, req.user!.organizationId!)
            res.success(stats)
        } catch (error) {
            next(error)
        }
    }

    async getCandidatesList(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user!.organizationId!
            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const filters: { search?: string; decision?: string; scoreMin?: number; scoreMax?: number } = {}
            if (req.query.search) filters.search = req.query.search as string
            if (req.query.decision) filters.decision = req.query.decision as string
            if (req.query.scoreMin) filters.scoreMin = parseInt(req.query.scoreMin as string)
            if (req.query.scoreMax) filters.scoreMax = parseInt(req.query.scoreMax as string)

            const result = await atsScreeningService.getCandidatesList(
                req.params.jobId, orgId, page, limit, filters
            )
            res.success(result)
        } catch (error) {
            next(error)
        }
    }

    async getCandidateBreakdown(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const breakdown = await atsScreeningService.getCandidateBreakdown(
                req.params.jobId, req.params.candidateId, req.user!.organizationId!
            )
            res.success({ breakdown })
        } catch (error) {
            next(error)
        }
    }

    async compareCandidates(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const orgId = req.user!.organizationId!
            const { jobId } = req.params
            const { c1, c2 } = req.query

            if (!c1 || !c2 || typeof c1 !== 'string' || typeof c2 !== 'string') {
                throw AppError.badRequest('Both c1 and c2 query parameters are required')
            }

            const results = await ScreeningResult.find({
                jobId,
                organizationId: orgId,
                candidateId: { $in: [c1, c2] },
            }).lean()

            if (results.length !== 2) {
                throw AppError.notFound('One or both candidates')
            }

            const candidates = await Candidate.find({ _id: { $in: [c1, c2] }, organizationId: orgId }).lean()
            const candMap = new Map(candidates.map(c => [c._id.toString(), c]))

            const top10Results = await ScreeningResult.find({
                jobId,
                organizationId: orgId,
                status: { $in: [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'] },
            }).sort({ finalScore: -1, confidenceScore: -1 }).limit(10).lean()
            const top10Set = new Set(top10Results.map(r => r.candidateId.toString()))

            const formattedCandidates = results.map(r => {
                const c = candMap.get(r.candidateId.toString())
                return {
                    id: r.candidateId.toString(),
                    name: c ? `${(c as any).firstName || ''} ${(c as any).lastName || ''}`.trim() || (c as any).email : 'Unknown',
                    status: r.status,
                    score: Math.round(r.finalScore ?? 0),
                    confidence: Math.round(r.confidenceScore ?? 0),
                    decision: (r as any).decisionStatus || 'PENDING',
                    isTop10: top10Set.has(r.candidateId.toString()),
                    isOverridden: (r as any).isOverridden || false,
                    overrideReason: (r as any).overrideReason,
                    overrideAt: (r as any).overrideAt ? new Date((r as any).overrideAt).toISOString() : undefined,
                    errorReason: r.errorReason,
                }
            })

            const [breakdown1, breakdown2] = await Promise.all([
                atsScreeningService.getCandidateBreakdown(jobId, c1, orgId),
                atsScreeningService.getCandidateBreakdown(jobId, c2, orgId),
            ])

            const r1 = results.find(r => r.candidateId.toString() === c1)!
            const r2 = results.find(r => r.candidateId.toString() === c2)!
            const s1 = r1.finalScore ?? 0
            const s2 = r2.finalScore ?? 0
            let winnerId: string | null = null
            let reason = 'Candidates are closely matched.'

            if (s1 > s2 + 2) {
                winnerId = c1
                reason = `Higher overall score (+${Math.round(s1 - s2)} points), matching rubric more closely.`
            } else if (s2 > s1 + 2) {
                winnerId = c2
                reason = `Higher overall score (+${Math.round(s2 - s1)} points), matching rubric more closely.`
            } else {
                const sk1 = (r1.scoreBreakdown as any)?.skillScore ?? 0
                const sk2 = (r2.scoreBreakdown as any)?.skillScore ?? 0
                if (sk1 > sk2 + 2) {
                    winnerId = c1
                    reason = `Similar overall scores, but has a stronger primary skill match (+${Math.round(sk1 - sk2)}% skills).`
                } else if (sk2 > sk1 + 2) {
                    winnerId = c2
                    reason = `Similar overall scores, but has a stronger primary skill match (+${Math.round(sk2 - sk1)}% skills).`
                }
            }

            res.success({
                candidates: formattedCandidates,
                breakdowns: { [c1]: breakdown1, [c2]: breakdown2 },
                recommendation: { winnerId, reason },
            })
        } catch (error) {
            next(error)
        }
    }

    async getJobProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const profile = await atsScreeningService.getJobProfile(req.params.jobId, req.user!.organizationId!)
            res.success({ profile })
        } catch (error) {
            next(error)
        }
    }

    async updateJobProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const profile = await atsScreeningService.updateJobProfile(
                req.params.jobId, req.user!.organizationId!, req.body
            )
            res.success({ profile })
        } catch (error) {
            next(error)
        }
    }

    async getWeights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const weights = await atsScreeningService.getWeights(req.params.jobId, req.user!.organizationId!)
            res.success({ weights })
        } catch (error) {
            next(error)
        }
    }

    async updateWeights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const weights = await atsScreeningService.updateWeights(
                req.params.jobId, req.user!.organizationId!, req.body, req.user!.id
            )
            res.success({ weights })
        } catch (error) {
            next(error)
        }
    }

    async getFeedbackSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const summary = await atsScreeningService.getFeedbackSummary(req.params.jobId, req.user!.organizationId!)
            res.success({ summary })
        } catch (error) {
            next(error)
        }
    }

    async overrideDecision(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { decision, reason } = req.body
            if (!['SHORTLISTED', 'REVIEW', 'REJECTED'].includes(decision)) {
                throw AppError.badRequest('Invalid decision value')
            }
            const result = await atsScreeningService.overrideDecision(
                req.params.jobId, req.params.candidateId, req.user!.organizationId!,
                req.user!.id, decision, reason || 'Manual override'
            )
            res.success({ result })
        } catch (error) {
            next(error)
        }
    }

    async bulkOverride(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { candidateIds, decision, reason } = req.body
            if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
                throw AppError.badRequest('candidateIds must be a non-empty array')
            }
            if (!['SHORTLISTED', 'REVIEW', 'REJECTED'].includes(decision)) {
                throw AppError.badRequest('Invalid decision value')
            }

            const results: { candidateId: string; success: boolean }[] = []
            const errors: { candidateId: string; error: string }[] = []

            for (const candidateId of candidateIds) {
                try {
                    await atsScreeningService.overrideDecision(
                        req.params.jobId, candidateId, req.user!.organizationId!,
                        req.user!.id, decision, reason || `Bulk ${decision.toLowerCase()}`
                    )
                    results.push({ candidateId, success: true })
                } catch (err: any) {
                    errors.push({ candidateId, error: err.message || 'Failed' })
                }
            }

            res.success({ processed: results.length, failed: errors.length, results, errors })
        } catch (error) {
            next(error)
        }
    }

    async retryParseFailed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { jobId, candidateId } = req.params
            const orgId = req.user!.organizationId!

            const result = await ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
            if (!result) throw AppError.notFound('Screening result')

            if (result.status !== ScreeningStatus.PARSE_FAILED && result.status !== ScreeningStatus.ERROR) {
                throw AppError.badRequest(
                    `Cannot retry: candidate is in '${result.status}' state. Only PARSE_FAILED or ERROR candidates can be retried.`
                )
            }

            await ScreeningResult.findOneAndUpdate(
                { candidateId, jobId, organizationId: orgId },
                {
                    $set: {
                        status: ScreeningStatus.AWAITING_PARSE,
                        errorReason: null,
                        statusPriority: deriveStatusPriority(ScreeningStatus.AWAITING_PARSE),
                    },
                    $unset: { hardGateFailureReason: '' },
                }
            )

            await enqueueAtsScreeningJob({
                type: 'CANDIDATE_APPLIED',
                applicationId: (result as any).applicationId || candidateId,
                candidateId,
                jobId,
                organizationId: orgId,
            })

            res.success({ message: 'Screening job re-queued. Results will update shortly.' })
        } catch (error) {
            next(error)
        }
    }
}

export const atsScreeningController = new AtsScreeningController()
