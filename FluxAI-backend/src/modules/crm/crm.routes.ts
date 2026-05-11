import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { crmController } from './crm.controller.js'

const router = Router()

// All CRM routes require authentication
router.use(authGuard)

// ── Talent Pools ─────────────────────────────────────────
router.get('/pools', (req, res, next) => crmController.listPools(req, res, next))
router.post('/pools', (req, res, next) => crmController.createPool(req, res, next))
router.get('/pools/:poolId', (req, res, next) => crmController.getPool(req, res, next))
router.patch('/pools/:poolId', (req, res, next) => crmController.updatePool(req, res, next))
router.delete('/pools/:poolId', (req, res, next) => crmController.deletePool(req, res, next))
router.post('/pools/:poolId/candidates', (req, res, next) => crmController.addToPool(req, res, next))
router.delete('/pools/:poolId/candidates', (req, res, next) => crmController.removeFromPool(req, res, next))
router.post('/pools/:poolId/refresh', (req, res, next) => crmController.refreshSmartPool(req, res, next))

// ── Saved Searches ───────────────────────────────────────
router.get('/searches', (req, res, next) => crmController.listSearches(req, res, next))
router.post('/searches', (req, res, next) => crmController.createSearch(req, res, next))
router.post('/searches/:searchId/execute', (req, res, next) => crmController.executeSearch(req, res, next))
router.delete('/searches/:searchId', (req, res, next) => crmController.deleteSearch(req, res, next))

// ── Segmentation ─────────────────────────────────────────
router.get('/segment', (req, res, next) => crmController.segmentCandidates(req, res, next))

// ── Bookmarks ────────────────────────────────────────────
router.get('/bookmarks', (req, res, next) => crmController.listBookmarks(req, res, next))
router.post('/bookmarks', (req, res, next) => crmController.createBookmark(req, res, next))
router.delete('/bookmarks/:candidateId', (req, res, next) => crmController.removeBookmark(req, res, next))

// ── Reminders ────────────────────────────────────────────
router.get('/reminders', (req, res, next) => crmController.listReminders(req, res, next))
router.post('/reminders', (req, res, next) => crmController.createReminder(req, res, next))
router.patch('/reminders/:reminderId/complete', (req, res, next) => crmController.completeReminder(req, res, next))
router.patch('/reminders/:reminderId/dismiss', (req, res, next) => crmController.dismissReminder(req, res, next))

// ── Relationships ────────────────────────────────────────
router.post('/relationships', (req, res, next) => crmController.logRelationship(req, res, next))
router.get('/relationships/:candidateId', (req, res, next) => crmController.getRelationshipTimeline(req, res, next))

// ── Tags ─────────────────────────────────────────────────
router.post('/tags/:candidateId', (req, res, next) => crmController.addTags(req, res, next))
router.delete('/tags/:candidateId', (req, res, next) => crmController.removeTags(req, res, next))

export const crmRoutes = router
