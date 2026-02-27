import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import compression from 'compression'
import { apiLimiter, authLimiter } from './common/middleware/rate-limiter.js'
import { requestLogger } from './common/middleware/request-logger.js'
import { requestIdMiddleware } from './common/middleware/request-id.middleware.js'
import { errorHandler } from './common/middleware/error-handler.js'
import { successResponse } from './common/utils/api-response.js'
import { isS3Configured, saveLocalFile } from './modules/storage/s3.client.js'
import fs from 'fs'
import path from 'path'

// Routes
import authRoutes from './modules/auth/auth.routes.js'
import organizationsRoutes from './modules/organizations/organizations.routes.js'
import assessmentsRoutes from './modules/assessments/assessments.routes.js'
import questionsRoutes from './modules/questions/questions.routes.js'
import jobsRoutes from './modules/jobs/jobs.routes.js'
import attemptsRoutes from './modules/attempts/attempts.routes.js'
import filesRoutes from './modules/files/files.routes.js'
import onboardingRoutes from './modules/onboarding/onboarding.routes.js'
import candidateOnboardingRoutes from './modules/onboarding/candidate-onboarding.routes.js'
import offersRoutes from './modules/offers/offers.routes.js'
import candidatesRoutes from './modules/candidates/candidates.routes.js'
import analyticsRoutes from './modules/analytics/analytics.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import publicRoutes from './modules/public/public.routes.js'
import applicationsRoutes from './modules/applications/applications.routes.js'
import aiInterviewRoutes from './modules/ai-interview/ai-interview.routes.js'
import { atsScreeningRoutes } from './modules/ats-screening/ats-screening.routes.js'
import { attemptsController } from './modules/attempts/attempts.controller.js'
import { resultsController } from './modules/results/results.controller.js'
import { filesController } from './modules/files/files.controller.js'
import { authGuard } from './common/guards/auth.guard.js'
import { workflowRoutes } from './modules/workflow/workflow.routes.js'
import { emailTrackingRoutes } from './modules/email/email-tracking.routes.js'
import { emailTemplateRoutes } from './modules/email/email-templates.routes.js'
import { interviewRoutes } from './modules/interviews/interviews.routes.js'
import auditRoutes from './modules/audit/audit.routes.js'
import { handleRibbonWebhook } from './modules/webhooks/ribbon.webhook.js'

export function createApp() {
    const app = express()

    // Security middleware
    app.use(helmet())
    app.use(compression())

    // Rate limiting
    app.use('/api/', apiLimiter)
    app.use('/api/auth/', authLimiter)

    // CORS configuration - flexible for development
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
    app.use(cors({
        origin: corsOrigins,
        credentials: true,
    }))

    // Ribbon webhook (must use raw body for signature verification; register before json parser)
    app.post('/api/webhooks/ribbon', express.raw({ type: 'application/json', limit: '1mb' }), (req, res) =>
        handleRibbonWebhook(req, res)
    )

    // Body parsing and cookies (for Ribbon callback cookie)
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    // Request ID tracking
    app.use(requestIdMiddleware)

    // Request logging
    app.use(requestLogger)

    // Health check
    app.get('/api/health', (_req, res) => {
        res.json(successResponse({ status: 'ok', timestamp: new Date().toISOString() }))
    })

    // ============================================
    // API ROUTES
    // ============================================

    // Phase 1: Authentication & Organizations
    app.use('/api/auth', authRoutes)
    app.use('/api/organizations', organizationsRoutes) // List & get by ID
    app.use('/api/organization', organizationsRoutes) // Legacy: current org from JWT

    // Phase 2: Assessments & Questions
    // IMPORTANT: Public candidate endpoint MUST be registered BEFORE the protected assessments routes
    // Otherwise the authGuard in assessmentsRoutes will reject candidate requests
    app.post('/api/assessments/:assessmentId/attempts', (req, res, next) =>
        attemptsController.startOrResume(req, res, next)
    )
    app.use('/api/assessments', assessmentsRoutes)
    app.use('/api/questions', questionsRoutes)
    app.use('/api/jobs', jobsRoutes)

    // Onboarding
    // Onboarding
    app.use('/api/onboarding', onboardingRoutes) // SaaS Onboarding
    app.use('/api/candidate-onboarding', candidateOnboardingRoutes) // ATS Candidate Onboarding
    app.use('/api/offers', offersRoutes) // Offer Management
    app.use('/api/candidates', candidatesRoutes)
    app.use('/api/applications', applicationsRoutes)

    // Phase 3: Attempts & Proctoring
    app.use('/api/attempts', attemptsRoutes)
    app.use('/api/attempts', aiInterviewRoutes) // AI Interview APIs

    // Local file upload for dev mode (when S3 is not configured)
    if (!isS3Configured()) {
        console.log('[DEV] S3 not configured — local file storage enabled at /api/uploads/local/')
        app.put('/api/uploads/local/:storageKey(*)', express.raw({ type: '*/*', limit: '100mb' }), (req, res) => {
            try {
                const storageKey = decodeURIComponent(req.params.storageKey)
                saveLocalFile(storageKey, req.body as Buffer)
                res.status(200).json({ success: true })
            } catch (err) {
                console.error('Local upload error:', err)
                res.status(500).json({ success: false, error: 'Failed to save file locally' })
            }
        })
        app.get('/api/uploads/local/:storageKey(*)', (req, res) => {
            const storageKey = decodeURIComponent(req.params.storageKey)
            const filePath = path.join(process.cwd(), 'uploads', storageKey)
            if (fs.existsSync(filePath)) {
                res.sendFile(filePath)
            } else {
                res.status(404).json({ success: false, error: 'File not found' })
            }
        })
    }

    // Phase 4: Results (assessment-level requires auth)
    app.get('/api/assessments/:assessmentId/results', authGuard, (req, res, next) =>
        resultsController.getAssessmentResults(req, res, next)
    )

    // Analytics & Dashboard
    app.use('/api/analytics', analyticsRoutes)
    app.use('/api/dashboard', dashboardRoutes)
    app.use('/api/public', publicRoutes)

    // ATS Screening
    app.use('/api/ats-screening', atsScreeningRoutes)

    app.get('/api/attempts/:attemptId/result', (req, res, next) =>
        resultsController.getAttemptResult(req, res, next)
    )

    // Phase 5: Files
    app.use('/api/files', filesRoutes)
    app.post('/api/attempts/:attemptId/resume', (req, res, next) =>
        filesController.attachResume(req, res, next)
    )
    app.post('/api/attempts/:attemptId/rounds/:roundType/video', (req, res, next) =>
        filesController.attachVideo(req, res, next)
    )

    // Phase 5: Workflows
    app.use('/api/workflows', workflowRoutes)

    // Phase 6: Email Tracking & Templates
    app.use('/api/tracking', emailTrackingRoutes)
    app.use('/api/email-templates', emailTemplateRoutes)

    // Phase 7: Interviews
    // Phase 7: Interviews
    app.use('/api/interviews', interviewRoutes)

    // Audit Logs
    app.use('/api/audit-logs', auditRoutes)

    // ============================================

    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Route not found' },
        })
    })

    // Error handler
    app.use(errorHandler)

    return app
}
