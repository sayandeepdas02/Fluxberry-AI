
import { Response, NextFunction } from 'express'
import { AuditLog } from '../../database/models/index.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'
import { createPaginatedResponse } from '../../common/dto/pagination.dto.js'

class AuditController {
    /**
     * GET /api/audit-logs
     * List audit logs for the organization
     */
    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const organizationId = req.user?.organizationId
            if (!organizationId) {
                throw AppError.unauthorized('Organization context required')
            }

            const page = parseInt(req.query.page as string) || 1
            const limit = parseInt(req.query.limit as string) || 20
            const skip = (page - 1) * limit

            const { entityType, action, userId } = req.query

            const filter: any = { organizationId }

            if (entityType) filter.entityType = entityType
            if (action) filter.action = action
            if (userId) filter.performedBy = userId

            const [logs, total] = await Promise.all([
                AuditLog.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('performedBy', 'firstName lastName email'),
                AuditLog.countDocuments(filter)
            ])

            res.success(createPaginatedResponse(logs, total, page, limit))
        } catch (error) {
            next(error)
        }
    }
}

export const auditController = new AuditController()
