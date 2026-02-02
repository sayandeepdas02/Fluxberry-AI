import { Request, Response, NextFunction } from 'express'
import { onboardingService } from './onboarding.service.js'
import { completeOnboardingSchema } from './onboarding.types.js'
import { successResponse } from '../../common/utils/api-response.js'
import { AuthenticatedRequest } from '../../common/guards/auth.guard.js'

export class OnboardingController {
    /**
     * POST /api/onboarding/complete
     * Complete user onboarding
     */
    async complete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.user?.id) {
                res.status(401).json({
                    success: false,
                    error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
                })
                return
            }

            const input = completeOnboardingSchema.parse(req.body)
            const result = await onboardingService.complete(req.user.id, input)
            res.json(successResponse(result))
        } catch (error) {
            next(error)
        }
    }
}

export const onboardingController = new OnboardingController()
