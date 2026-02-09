import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { requestLogger } from './common/middleware/request-logger.js'
import { errorHandler } from './common/middleware/error-handler.js'
import { successResponse } from './common/utils/api-response.js'

// Routes
import authRoutes from './modules/auth/auth.routes.js'
import organizationsRoutes from './modules/organizations/organizations.routes.js'
import assessmentsRoutes from './modules/assessments/assessments.routes.js'
import questionsRoutes from './modules/questions/questions.routes.js'
import jobsRoutes from './modules/jobs/jobs.routes.js'
import attemptsRoutes from './modules/attempts/attempts.routes.js'
import filesRoutes from './modules/files/files.routes.js'
import onboardingRoutes from './modules/onboarding/onboarding.routes.js'
import candidatesRoutes from './modules/candidates/candidates.routes.js'
import analyticsRoutes from './modules/analytics/analytics.routes.js'
import dashboardRoutes from './modules/dashboard/dashboard.routes.js'
import publicRoutes from './modules/public/public.routes.js'
import aiInterviewRoutes from './modules/ai-interview/ai-interview.routes.js'
import { attemptsController } from './modules/attempts/attempts.controller.js'
import { resultsController } from './modules/results/results.controller.js'
import { filesController } from './modules/files/files.controller.js'
import { authGuard } from './common/guards/auth.guard.js'

export function createApp() {
    const app = express()

    // Security middleware
    app.use(helmet())

    // CORS configuration - flexible for development
    const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001']
    app.use(cors({
        origin: corsOrigins,
        credentials: true,
    }))

    // Body parsing
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: true }))

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
    app.use('/api/onboarding', onboardingRoutes)
    app.use('/api/candidates', candidatesRoutes)

    // Phase 3: Attempts & Proctoring
    app.use('/api/attempts', attemptsRoutes)
    app.use('/api/attempts', aiInterviewRoutes) // AI Interview APIs

    // Phase 4: Results (assessment-level requires auth)
    app.get('/api/assessments/:assessmentId/results', authGuard, (req, res, next) =>
        resultsController.getAssessmentResults(req, res, next)
    )

    // Analytics
    app.use('/api/analytics', analyticsRoutes)
    app.use('/api/dashboard', dashboardRoutes)
    app.use('/api/public', publicRoutes)

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
