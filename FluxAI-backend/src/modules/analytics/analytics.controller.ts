import { Response, NextFunction } from 'express'
import { analyticsService } from './analytics.service.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class AnalyticsController {
    /**
     * GET /api/analytics/kpis
     */
    async getKPIs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getKPIs(organizationId)
            res.json(successResponse(data))
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
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getTrends(organizationId)
            res.json(successResponse(data))
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
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }

            const data = await analyticsService.getDemographics(organizationId)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }
}

export const analyticsController = new AnalyticsController()
