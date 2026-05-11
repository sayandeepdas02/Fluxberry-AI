import { Router, Request, Response, NextFunction } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { referralService } from './referral.service.js'

const router = Router()
router.use(authGuard)

// Programs
router.get('/programs', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.listPrograms((req as any).organizationId) }) } catch (e) { next(e) }
})
router.post('/programs', async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await referralService.createProgram((req as any).organizationId, req.body, (req as any).userId) }) } catch (e) { next(e) }
})
router.patch('/programs/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.updateProgram(req.params.id, (req as any).organizationId, req.body) }) } catch (e) { next(e) }
})

// Referrals
router.post('/submit', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).userId
        const data = { ...req.body, referrerId: userId }
        res.status(201).json({ success: true, data: await referralService.submitReferral((req as any).organizationId, data) })
    } catch (e) { next(e) }
})
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await referralService.listReferrals((req as any).organizationId, {
            referrerId: req.query.referrerId as string,
            status: req.query.status as string,
            page: Number(req.query.page) || 1,
            limit: Number(req.query.limit) || 20,
        })
        res.json({ success: true, data: result })
    } catch (e) { next(e) }
})
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.updateReferralStatus(req.params.id, (req as any).organizationId, req.body.status) }) } catch (e) { next(e) }
})

// Leaderboard & Analytics
router.get('/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.getLeaderboard((req as any).organizationId) }) } catch (e) { next(e) }
})
router.get('/analytics', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.getReferralAnalytics((req as any).organizationId) }) } catch (e) { next(e) }
})

// Rewards
router.get('/rewards', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.listRewards((req as any).organizationId, req.query.status as string) }) } catch (e) { next(e) }
})
router.patch('/rewards/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await referralService.approveReward(req.params.id, (req as any).organizationId, (req as any).userId) }) } catch (e) { next(e) }
})

export const referralRoutes = router
