import { Router } from 'express'
import { interviewController } from './interviews.controller.js'
import { requireOrgAccess } from '../../common/guards/auth.guard.js'
import { MemberRole } from '../../database/models/index.js'

const router = Router()

// All interview routes require organization access
router.use(requireOrgAccess(MemberRole.INTERVIEWER))

router.post('/', interviewController.createInterview)
router.get('/', interviewController.getInterviews)
router.get('/:id', interviewController.getInterview)
router.patch('/:id', interviewController.updateInterview)
router.delete('/:id', interviewController.cancelInterview)

// Scorecards
router.post('/scorecards', interviewController.submitScorecard) // Body contains interviewId
router.get('/:interviewId/scorecard', interviewController.getScorecard)

export const interviewRoutes = router
