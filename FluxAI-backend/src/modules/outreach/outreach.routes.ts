import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { Request, Response, NextFunction } from 'express'
import { outreachService } from './outreach.service.js'

const router = Router()
router.use(authGuard)

// ── Sequences ────────────────────────────────────────────
router.get('/sequences', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.listSequences((req as any).organizationId) }) } catch (e) { next(e) }
})
router.post('/sequences', async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await outreachService.createSequence((req as any).organizationId, req.body, (req as any).userId) }) } catch (e) { next(e) }
})
router.patch('/sequences/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.updateSequence(req.params.id, (req as any).organizationId, req.body) }) } catch (e) { next(e) }
})

// ── Campaigns ────────────────────────────────────────────
router.get('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.listCampaigns((req as any).organizationId) }) } catch (e) { next(e) }
})
router.post('/campaigns', async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await outreachService.createCampaign((req as any).organizationId, req.body, (req as any).userId) }) } catch (e) { next(e) }
})
router.post('/campaigns/:id/launch', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.launchCampaign(req.params.id, (req as any).organizationId) }) } catch (e) { next(e) }
})
router.get('/campaigns/:id/analytics', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.getCampaignAnalytics(req.params.id, (req as any).organizationId) }) } catch (e) { next(e) }
})

// ── Tracking (public — no auth) ─────────────────────────
router.get('/track/:pixelId', async (req: Request, res: Response) => {
    await outreachService.recordOpen(req.params.pixelId)
    // Return 1x1 transparent GIF
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
    res.writeHead(200, { 'Content-Type': 'image/gif', 'Content-Length': pixel.length, 'Cache-Control': 'no-cache' })
    res.end(pixel)
})

// ── Templates ────────────────────────────────────────────
router.get('/templates', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.listTemplates((req as any).organizationId, req.query.type as string) }) } catch (e) { next(e) }
})
router.post('/templates', async (req: Request, res: Response, next: NextFunction) => {
    try { res.status(201).json({ success: true, data: await outreachService.createTemplate((req as any).organizationId, req.body, (req as any).userId) }) } catch (e) { next(e) }
})
router.patch('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.updateTemplate(req.params.id, (req as any).organizationId, req.body) }) } catch (e) { next(e) }
})
router.delete('/templates/:id', async (req: Request, res: Response, next: NextFunction) => {
    try { res.json({ success: true, data: await outreachService.deleteTemplate(req.params.id, (req as any).organizationId) }) } catch (e) { next(e) }
})

export const outreachRoutes = router
