import { Router, Request, Response, NextFunction } from 'express'
import { candidatePortalService } from './candidate-portal.service.js'

const router = Router()

// Note: In production, these routes would use a candidate-specific auth middleware
// For Phase 3 implementation, we expect a candidateToken in headers.
const candidateAuthGuard = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['x-candidate-token'] as string
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' })
    // Mock token decoding: assume token === candidateId for testing
    // Also requires an org-id header
    ;(req as any).candidateId = token
    ;(req as any).organizationId = req.headers['x-org-id'] as string
    next()
}

router.use(candidateAuthGuard)

router.get('/dashboard', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await candidatePortalService.getDashboard((req as any).candidateId, (req as any).organizationId) }) } catch (e) { next(e) }
})

router.get('/applications/:applicationId/timeline', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await candidatePortalService.getApplicationTimeline(req.params.applicationId, (req as any).candidateId, (req as any).organizationId) }) } catch (e) { next(e) }
})

router.get('/applications/:applicationId/prep-kit', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await candidatePortalService.getInterviewPrepKit(req.params.applicationId, (req as any).candidateId, (req as any).organizationId) }) } catch (e) { next(e) }
})

export const candidatePortalRoutes = router
