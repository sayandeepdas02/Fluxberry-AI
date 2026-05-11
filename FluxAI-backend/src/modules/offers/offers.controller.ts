import { Response, NextFunction } from 'express'
import { offersService } from './offers.service.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'
import { AppError } from '../../common/errors/index.js'

export class OffersController {
    async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            if (!organizationId) throw AppError.forbidden('Organization context required')
            const { applicationId, templateId, variables, expiresInDays } = req.body
            let offer = await offersService.createOfferDraft(organizationId, applicationId, templateId, variables, expiresInDays, req.user!.id)
            offer = await offersService.generateOfferPdf(offer._id.toString(), organizationId)
            res.success(offer, 201)
        } catch (error) {
            next(error)
        }
    }

    async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            if (!organizationId) throw AppError.forbidden('Organization context required')
            const offer = await offersService.getOffer(req.params.id, organizationId)
            if (!offer) throw AppError.notFound('Offer')
            res.success(offer)
        } catch (error) {
            next(error)
        }
    }

    async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            if (!organizationId) throw AppError.forbidden('Organization context required')
            const offers = await offersService.getOffers(organizationId)
            res.success(offers)
        } catch (error) {
            next(error)
        }
    }

    async listByApplication(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            if (!organizationId) throw AppError.forbidden('Organization context required')
            const offers = await offersService.getOffersByApplication(req.params.applicationId, organizationId)
            res.success(offers)
        } catch (error) {
            next(error)
        }
    }

    async send(req: AuthenticatedRequest, res: Response, next: NextFunction) {
        try {
            const { organizationId } = req.user!
            if (!organizationId) throw AppError.forbidden('Organization context required')
            const offer = await offersService.sendOfferEmail(req.params.id, organizationId, req.user!.id)
            res.success(offer)
        } catch (error) {
            next(error)
        }
    }
}

export const offersController = new OffersController()
