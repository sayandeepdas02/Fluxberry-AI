import { Response, NextFunction } from 'express'
import { organizationsService } from './organizations.service.js'
import { updateOrganizationSchema } from './organizations.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class OrganizationsController {
    /**
     * GET /api/organizations
     * Get all organizations the user belongs to
     */
    async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id
            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                })
                return
            }

            const orgs = await organizationsService.getAll(userId)
            res.json(successResponse(orgs))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/organizations/:orgId
     * Get a specific organization
     */
    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id
            const { orgId } = req.params

            if (!userId) {
                res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
                })
                return
            }

            const org = await organizationsService.getById(orgId, userId)
            res.json(successResponse(org))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/organization
     * Get the current user's organization (from JWT)
     */
    async get(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id
            const organizationId = req.user?.organizationId

            if (!userId || !organizationId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'NO_ORG', message: 'User is not part of an organization' },
                })
                return
            }

            const org = await organizationsService.getById(organizationId, userId)
            res.json(successResponse(org))
        } catch (error) {
            next(error)
        }
    }

    /**
     * PATCH /api/organization
     * Update the current user's organization (OWNER/ADMIN only)
     */
    async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id
            const organizationId = req.user?.organizationId

            if (!userId || !organizationId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'NO_ORG', message: 'User is not part of an organization' },
                })
                return
            }

            const input = updateOrganizationSchema.parse(req.body)
            const org = await organizationsService.update(organizationId, userId, input)
            res.json(successResponse(org))
        } catch (error) {
            next(error)
        }
    }

    /**
     * GET /api/organization/members
     * Get members of the current user's organization
     */
    async getMembers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id
            const organizationId = req.user?.organizationId

            if (!userId || !organizationId) {
                res.status(400).json({
                    success: false,
                    error: { code: 'NO_ORG', message: 'User is not part of an organization' },
                })
                return
            }

            const members = await organizationsService.getMembers(organizationId, userId)
            res.json(successResponse(members))
        } catch (error) {
            next(error)
        }
    }
}

export const organizationsController = new OrganizationsController()
