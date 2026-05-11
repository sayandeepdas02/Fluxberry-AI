import { Router, Request, Response, NextFunction } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { workflowEngineV2 } from './workflow-engine-v2.js'
import { WorkflowDefinition, WorkflowExecution } from '../../database/models/workflow-v2.models.js'
import { Types } from 'mongoose'

const router = Router()
router.use(authGuard)

// ── Definitions ──────────────────────────────────────────
router.get('/definitions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const definitions = await WorkflowDefinition.find({ organizationId: new Types.ObjectId((req as any).organizationId) })
            .populate('createdBy', 'firstName lastName').sort({ updatedAt: -1 }).lean()
        res.json({ success: true, data: definitions })
    } catch (e) { next(e) }
})

router.post('/definitions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const def = await WorkflowDefinition.create({
            organizationId: new Types.ObjectId((req as any).organizationId),
            createdBy: new Types.ObjectId((req as any).userId),
            ...req.body
        })
        res.status(201).json({ success: true, data: def })
    } catch (e) { next(e) }
})

router.get('/definitions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const def = await WorkflowDefinition.findOne({ _id: req.params.id, organizationId: new Types.ObjectId((req as any).organizationId) }).lean()
        if (!def) return res.status(404).json({ success: false, error: 'Not found' })
        res.json({ success: true, data: def })
    } catch (e) { next(e) }
})

router.put('/definitions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const def = await WorkflowDefinition.findOneAndUpdate(
            { _id: req.params.id, organizationId: new Types.ObjectId((req as any).organizationId) },
            { $set: { ...req.body, version: req.body.version ? req.body.version + 1 : 1 } },
            { new: true }
        )
        res.json({ success: true, data: def })
    } catch (e) { next(e) }
})

// ── Executions ───────────────────────────────────────────
router.get('/executions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityId, definitionId, status } = req.query
        const filter: any = { organizationId: new Types.ObjectId((req as any).organizationId) }
        if (entityId) filter.entityId = entityId
        if (definitionId) filter.definitionId = new Types.ObjectId(definitionId as string)
        if (status) filter.status = status

        const executions = await WorkflowExecution.find(filter)
            .populate('definitionId', 'name')
            .sort({ startedAt: -1 }).limit(50).lean()
        res.json({ success: true, data: executions })
    } catch (e) { next(e) }
})

router.get('/executions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const execution = await WorkflowExecution.findOne({ _id: req.params.id, organizationId: new Types.ObjectId((req as any).organizationId) })
            .populate('definitionId', 'name nodes').lean()
        if (!execution) return res.status(404).json({ success: false, error: 'Not found' })
        res.json({ success: true, data: execution })
    } catch (e) { next(e) }
})

export const workflowV2Routes = router
