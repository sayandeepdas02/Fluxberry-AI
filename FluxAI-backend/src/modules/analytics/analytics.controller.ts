import { Response, NextFunction } from 'express'
import { analyticsService } from './analytics.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class AnalyticsController {
    /**
     * GET /api/analytics/kpis
     */
    async getKPIs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const jobId = req.query.jobId as string | undefined

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getKPIs(organizationId, jobId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/analytics/trends
     */
    async getTrends(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const jobId = req.query.jobId as string | undefined
            const timeframe = req.query.timeframe as 'week' | 'month' | undefined

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getApplicationVolume(organizationId, timeframe, jobId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/analytics/demographics
     */
    async getDemographics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const jobId = req.query.jobId as string | undefined

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const sourceData = await analyticsService.getSourcePerformance(organizationId, jobId)

            // For now, location is empty as defined in service
            res.success({
                device: sourceData, // Mapping source to device for backward compatibility or UI expectation
                location: []
            })
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/analytics/funnel
     */
    async getFunnel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const jobId = req.query.jobId as string | undefined

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getFunnelMetrics(organizationId, jobId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/analytics/time-to-hire
     */
    async getTimeToHire(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const jobId = req.query.jobId as string | undefined

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getTimeToHire(organizationId, jobId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/analytics/onboarding
     */
    async getOnboardingMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const { onboardingAnalyticsService } = await import('./onboarding-analytics.service.js')
            const data = await onboardingAnalyticsService.getOnboardingMetrics(organizationId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/analytics/ats-efficiency
     */
    async getAtsEfficiency(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            const jobId = req.query.jobId as string | undefined

            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getAtsEfficiencyMetrics(organizationId, jobId)
            res.success(data)
        } catch (error) {
            next(error)
        }
    }

    // ── Phase 3 Advanced Analytics ────────────────────────────

    async getHiringVelocity(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) { res.status(403).json({ success: false }); return }
            const months = req.query.months ? parseInt(req.query.months as string) : 6
            const data = await analyticsService.getHiringVelocityTrend(organizationId, months)
            res.success(data)
        } catch (error) { next(error) }
    }

    async getSourceQuality(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) { res.status(403).json({ success: false }); return }
            const data = await analyticsService.getSourceQualityScoring(organizationId)
            res.success(data)
        } catch (error) { next(error) }
    }

    async getStageDropoff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) { res.status(403).json({ success: false }); return }
            const jobId = req.query.jobId as string | undefined
            const data = await analyticsService.getStageDropoffAnalysis(organizationId, jobId)
            res.success(data)
        } catch (error) { next(error) }
    }

    async getRecruiterPerformance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) { res.status(403).json({ success: false }); return }
            const data = await analyticsService.getRecruiterPerformance(organizationId)
            res.success(data)
        } catch (error) { next(error) }
    }
}

export const analyticsController = new AnalyticsController()
