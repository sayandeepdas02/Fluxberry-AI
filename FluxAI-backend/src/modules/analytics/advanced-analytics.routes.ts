import { Router, Request, Response, NextFunction } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { advancedAnalyticsService } from './advanced-analytics.service.js'

const router = Router()
router.use(authGuard)

router.get('/recruiter-performance', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getRecruiterPerformance((req as any).organizationId) }) } catch (e) { next(e) }
})

router.get('/velocity', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getHiringVelocityTrends((req as any).organizationId, Number(req.query.months) || 6) }) } catch (e) { next(e) }
})

router.get('/source-quality', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getSourceQuality((req as any).organizationId) }) } catch (e) { next(e) }
})

router.get('/funnel', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getDetailedFunnel((req as any).organizationId, req.query.jobId as string) }) } catch (e) { next(e) }
})

router.get('/dropoff', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getStageDropoff((req as any).organizationId, req.query.jobId as string) }) } catch (e) { next(e) }
})

router.get('/offer-acceptance', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getOfferAcceptance((req as any).organizationId) }) } catch (e) { next(e) }
})

router.get('/heatmap', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getBottleneckHeatmap((req as any).organizationId) }) } catch (e) { next(e) }
})

router.get('/forecast', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await advancedAnalyticsService.getHiringForecast((req as any).organizationId) }) } catch (e) { next(e) }
})

export const advancedAnalyticsRoutes = router
