import { Response, NextFunction } from 'express'
import { Request } from 'express'
import { publicService } from './public.service.js'
import { successResponse } from '../../common/utils/api-response.js'

class PublicController {
    async getCompany(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.getCompanyBySlug(slug)
            successResponse(res, 'Company data retrieved', data)
        } catch (error) {
            next(error)
        }
    }

    async getCompanyJobs(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params
            const data = await publicService.getCompanyJobs(slug)
            successResponse(res, 'Company jobs retrieved', data)
        } catch (error) {
            next(error)
        }
    }

    async getJob(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug, jobId } = req.params
            const data = await publicService.getJob(slug, jobId)
            successResponse(res, 'Job retrieved', data)
        } catch (error) {
            next(error)
        }
    }
}

export const publicController = new PublicController()
