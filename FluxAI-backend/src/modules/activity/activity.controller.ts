import { Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { activityService } from './activity.service.js'
import { ListActivityQuery } from './activity.types.js'

class ActivityController {
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const organizationId = req.user!.organizationId!
            const query: ListActivityQuery = {
                page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
                entityType: req.query.entityType as string,
                entityId: req.query.entityId as string,
                actorType: req.query.actorType as string,
            }

            const result = await activityService.list(organizationId, query)
            res.success(result)
        } catch (err) {
            next(err)
        }
    }
}

export const activityController = new ActivityController()
