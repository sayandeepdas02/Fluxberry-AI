import { Response, NextFunction } from 'express'
import { dashboardService } from './dashboard.service.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

class DashboardController {
    async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const data = await dashboardService.getSummary(req.user!.organizationId)
            successResponse(res, 'Dashboard summary parsed successfully', data)
        } catch (error) {
            next(error)
        }
    }
}

export const dashboardController = new DashboardController()
