import { Router } from 'express'
import { emailTemplateController } from './email-templates.controller.js'
import { requireOrgAccess } from '../../common/guards/auth.guard.js'
import { MemberRole } from '../../database/models/index.js'

const router = Router()

// Only authorized members can manage templates
router.use(requireOrgAccess(MemberRole.RECRUITER))

router.post('/', emailTemplateController.create)
router.get('/', emailTemplateController.list)
router.get('/:id', emailTemplateController.getById)
router.patch('/:id', emailTemplateController.update)
router.delete('/:id', emailTemplateController.delete)
router.post('/:id/send', (req, res, next) => emailTemplateController.send(req, res, next))

export const emailTemplateRoutes = router
