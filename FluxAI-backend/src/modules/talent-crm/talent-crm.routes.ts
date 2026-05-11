import { Router } from 'express'
import { authGuard } from '../../common/guards/auth.guard.js'
import { talentCRMController } from './talent-crm.controller.js'

const router = Router()
router.use(authGuard)

// ── Talent Pools ───────────────────────────────────────────────
router.get('/pools',                          (req, res, next) => talentCRMController.listPools(req, res, next))
router.post('/pools',                         (req, res, next) => talentCRMController.createPool(req, res, next))
router.get('/pools/:id',                      (req, res, next) => talentCRMController.getPool(req, res, next))
router.patch('/pools/:id',                    (req, res, next) => talentCRMController.updatePool(req, res, next))
router.delete('/pools/:id',                   (req, res, next) => talentCRMController.deletePool(req, res, next))
router.get('/pools/:id/candidates',           (req, res, next) => talentCRMController.getPoolCandidates(req, res, next))
router.post('/pools/:id/candidates/add',      (req, res, next) => talentCRMController.addCandidates(req, res, next))
router.post('/pools/:id/candidates/remove',   (req, res, next) => talentCRMController.removeCandidates(req, res, next))

// ── Saved Searches ─────────────────────────────────────────────
router.get('/saved-searches',                 (req, res, next) => talentCRMController.listSavedSearches(req, res, next))
router.post('/saved-searches',                (req, res, next) => talentCRMController.createSavedSearch(req, res, next))
router.delete('/saved-searches/:id',          (req, res, next) => talentCRMController.deleteSavedSearch(req, res, next))
router.post('/saved-searches/:id/run',        (req, res, next) => talentCRMController.runSavedSearch(req, res, next))

// ── Follow-up Reminders ────────────────────────────────────────
router.get('/reminders',                      (req, res, next) => talentCRMController.listReminders(req, res, next))
router.post('/reminders',                     (req, res, next) => talentCRMController.createReminder(req, res, next))
router.post('/reminders/:id/complete',        (req, res, next) => talentCRMController.completeReminder(req, res, next))
router.delete('/reminders/:id',               (req, res, next) => talentCRMController.deleteReminder(req, res, next))

// ── Bookmarks ──────────────────────────────────────────────────
router.get('/bookmarks',                      (req, res, next) => talentCRMController.listBookmarks(req, res, next))
router.post('/bookmarks/:candidateId',        (req, res, next) => talentCRMController.bookmarkCandidate(req, res, next))
router.delete('/bookmarks/:candidateId',      (req, res, next) => talentCRMController.removeBookmark(req, res, next))

export default router
