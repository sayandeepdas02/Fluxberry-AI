import { Response, NextFunction } from 'express'
import { dashboardService } from './dashboard.service.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

class DashboardController {
    async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }
            const data = await dashboardService.getSummary(organizationId)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }

    async getAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                res.status(403).json({ success: false, error: { code: 'NO_ORG', message: 'User must belong to an organization' } })
                return
            }
            const data = await dashboardService.getAnalytics(organizationId)
            res.json(successResponse(data))
        } catch (error) {
            next(error)
        }
    }
}

export const dashboardController = new DashboardController()

