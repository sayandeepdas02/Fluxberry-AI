import { Request, Response, NextFunction } from 'express'
import { offersService } from './offers.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class OffersController {

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const { applicationId, templateId, variables, expiresInDays } = req.body
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) return res.status(403).json({ error: 'Organization context required' })

            // 1. Create Draft
            let offer = await offersService.createOfferDraft(
                user.organizationId,
                applicationId,
                templateId,
                variables,
                expiresInDays
            )

            // 2. Generate PDF instantly
            offer = await offersService.generateOfferPdf(offer._id.toString(), user.organizationId)

            res.status(201).json({ success: true, data: offer })
        } catch (error) {
            next(error)
        }
    }

    async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) return res.status(403).json({ error: 'Organization context required' })

            const offer = await offersService.getOffer(id, user.organizationId)
            if (!offer) {
                res.status(404).json({ success: false, message: 'Offer not found' })
                return
            }

            res.json({ success: true, data: offer })
        } catch (error) {
            next(error)
        }
    }

    async list(req: Request, res: Response, next: NextFunction) {
        try {
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) return res.status(403).json({ error: 'Organization context required' })

            const offers = await offersService.getOffers(user.organizationId)
            res.json({ success: true, data: offers })
        } catch (error) {
            next(error)
        }
    }

    async listByApplication(req: Request, res: Response, next: NextFunction) {
        try {
            const { applicationId } = req.params
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) return res.status(403).json({ error: 'Organization context required' })

            const offers = await offersService.getOffersByApplication(applicationId, user.organizationId)
            res.json({ success: true, data: offers })
        } catch (error) {
            next(error)
        }
    }

    async send(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const user = (req as AuthenticatedRequest).user
            if (!user?.organizationId) return res.status(403).json({ error: 'Organization context required' })

            const offer = await offersService.sendOfferEmail(id, user.organizationId)
            res.json({ success: true, data: offer })
        } catch (error) {
            next(error)
        }
    }
}

export const offersController = new OffersController()
