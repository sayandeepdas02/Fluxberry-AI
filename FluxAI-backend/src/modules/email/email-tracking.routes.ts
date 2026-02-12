import { Router } from 'express'
import { emailTrackingController } from './email-tracking.controller.js'

const router = Router()

// Public route for tracking pixel
router.get('/pixel.png', emailTrackingController.trackOpen)

export const emailTrackingRoutes = router
