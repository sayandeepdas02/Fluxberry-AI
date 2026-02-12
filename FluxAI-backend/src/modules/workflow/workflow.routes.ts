import { Router } from 'express'
import { workflowController } from './workflow.controller.js'
import { requireOrgAccess } from '../../common/guards/auth.guard.js'
import { MemberRole } from '../../database/models/index.js'

const router = Router()

// All workflow routes require organization access
// Only Admins and Owners can manage workflows
router.use(requireOrgAccess(MemberRole.ADMIN))

router.post('/', workflowController.createRule)
router.get('/', workflowController.getRules)
router.get('/:id', workflowController.getRule)
router.patch('/:id', workflowController.updateRule)
router.delete('/:id', workflowController.deleteRule)

export const workflowRoutes = router
