import { Router, Request, Response, NextFunction } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { collaborationService } from './collaboration.service.js'

const router = Router()
router.use(authGuard)

// ── Feedback ─────────────────────────────────────────────
router.post('/feedback', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = { ...req.body, reviewerId: (req as any).userId }
        res.status(201).json({ success: true, data: await collaborationService.submitFeedback((req as any).organizationId, data) })
    } catch (e) { next(e) }
})
router.get('/feedback/:applicationId', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.getFeedbackForApplication((req as any).organizationId, req.params.applicationId) }) } catch (e) { next(e) }
})
router.get('/calibration/:applicationId', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.getCalibrationView((req as any).organizationId, req.params.applicationId) }) } catch (e) { next(e) }
})

// ── Approvals ────────────────────────────────────────────
router.post('/approvals', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = { ...req.body, initiatedBy: (req as any).userId }
        res.status(201).json({ success: true, data: await collaborationService.createApprovalChain((req as any).organizationId, data) })
    } catch (e) { next(e) }
})
router.get('/approvals/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.getApprovalChain((req as any).organizationId, req.params.entityType, req.params.entityId) }) } catch (e) { next(e) }
})
router.post('/approvals/:chainId/decide', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ success: true, data: await collaborationService.processApprovalDecision(
            (req as any).organizationId, req.params.chainId, (req as any).userId, req.body.decision, req.body.notes
        )})
    } catch (e) { next(e) }
})

// ── Discussions ──────────────────────────────────────────
router.get('/threads/:entityType/:entityId', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.getOrCreateThread((req as any).organizationId, req.params.entityType, req.params.entityId) }) } catch (e) { next(e) }
})
router.post('/threads/:threadId/messages', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.addMessage((req as any).organizationId, req.params.threadId, (req as any).userId, req.body.content) }) } catch (e) { next(e) }
})
router.patch('/threads/:threadId/resolve', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.resolveThread((req as any).organizationId, req.params.threadId) }) } catch (e) { next(e) }
})

// ── Committees ───────────────────────────────────────────
router.get('/committees/:jobId', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.getOrCreateCommittee((req as any).organizationId, req.params.jobId) }) } catch (e) { next(e) }
})
router.put('/committees/:jobId', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await collaborationService.updateCommittee((req as any).organizationId, req.params.jobId, req.body.memberIds, req.body.decisionPolicy) }) } catch (e) { next(e) }
})

export const collaborationRoutes = router
