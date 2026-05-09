import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { billingService } from './billing.service.js'

export class BillingController {

    /**
     * GET /api/billing/status
     * Returns the current plan, trial status, and installed apps for the caller's org.
     */
    async getStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) {
                return res.status(403).json({ success: false, error: 'Organization context required' })
            }
            const status = await billingService.getStatus(user.organizationId)
            res.success(status)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/billing/apps/:appId/install
     * Installs an app for the organization (persisted to MongoDB).
     */
    async installApp(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) {
                return res.status(403).json({ success: false, error: 'Organization context required' })
            }
            const { appId } = req.params
            const status = await billingService.installApp(user.organizationId, appId)
            res.success(status)
        } catch (error) {
            next(error)
        }
    }

    /**
     * POST /api/billing/apps/:appId/uninstall
     * Uninstalls an app for the organization.
     */
    async uninstallApp(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) {
                return res.status(403).json({ success: false, error: 'Organization context required' })
            }
            const { appId } = req.params
            const status = await billingService.uninstallApp(user.organizationId, appId)
            res.success(status)
        } catch (error) {
            next(error)
        }
    }
}

export const billingController = new BillingController()
