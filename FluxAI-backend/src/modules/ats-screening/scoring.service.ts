/**
 * ATS Scoring Service
 *
 * Manages scoring weights and configuration.
 * All reads/writes go to Job.scoringConfig (single source of truth).
 * Legacy JobScreeningProfile is read-only for fallback compatibility.
 */

import { Job as JobModel, AuditLog } from '../../database/models/index.js'
import { JobScreeningProfile } from './models/job-screening-profile.model.js'
import {
    DEFAULT_SCORING_CONFIG,
    fromLegacyProfile,
    type IScoringConfig,
    type IScoringConfigWeights,
} from './scoring-config.types.js'
import { AppError } from '../../common/errors/app-error.js'
import { scoreCandidate } from './scoring-v2/scoring-engine-v2.js'
import type { V2JobContext, V2ScoringResult } from './scoring-v2/types.js'
import type { IResumeParsedData } from './models/resume-profile.model.js'

export class ScoringService {
    /**
     * Get scoring weights for a job.
     * Reads from Job.scoringConfig (primary) or legacy profile (fallback).
     */
    async getWeights(jobId: string, orgId: string): Promise<{
        skills: number; experience: number; projects: number; education: number; signalBoost: number
    }> {
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId }).select('scoringConfig').lean()
        const weights = (job as any)?.scoringConfig?.weights

        if (weights) {
            return {
                skills:      weights.skills,
                experience:  weights.experience,
                projects:    weights.projects,
                education:   weights.education,
                signalBoost: weights.signalBoost,
            }
        }

        // Legacy fallback
        const profile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })
        const legacyW = profile?.weightsV2 ?? profile?.weights
        if (legacyW) {
            return {
                skills:      legacyW.skillWeight,
                experience:  legacyW.experienceWeight,
                projects:    legacyW.projectWeight,
                education:   legacyW.educationWeight,
                signalBoost: 'signalBoostWeight' in legacyW ? legacyW.signalBoostWeight : legacyW.bonusWeight,
            }
        }

        // Default
        return DEFAULT_SCORING_CONFIG.weights
    }

    /**
     * Update scoring weights for a job.
     * Writes to Job.scoringConfig (primary source of truth).
     */
    async updateWeights(
        jobId: string,
        orgId: string,
        weights: { skills: number; experience: number; projects: number; education: number; signalBoost: number },
        performedBy?: string
    ): Promise<typeof weights> {
        // Validation
        const values = [weights.skills, weights.experience, weights.projects, weights.education, weights.signalBoost]
        for (const v of values) {
            if (typeof v !== 'number' || v < 0 || v > 1) {
                throw AppError.validation(`Each weight must be between 0 and 1. Got: ${v}`)
            }
        }
        const total = values.reduce((sum, v) => sum + v, 0)
        if (Math.abs(total - 1.0) > 0.01) {
            throw AppError.validation(`Weights must sum to 1.0. Current sum: ${total.toFixed(2)}`)
        }

        // Write to Job.scoringConfig.weights
        const job = await JobModel.findOneAndUpdate(
            { _id: jobId, organizationId: orgId },
            {
                $set: {
                    'scoringConfig.weights.skills':      weights.skills,
                    'scoringConfig.weights.experience':  weights.experience,
                    'scoringConfig.weights.projects':    weights.projects,
                    'scoringConfig.weights.education':   weights.education,
                    'scoringConfig.weights.signalBoost': weights.signalBoost,
                },
            },
            { new: true }
        )

        if (!job) {
            throw AppError.notFound('Job')
        }

        AuditLog.create({
            organizationId: orgId,
            entityType: 'Job',
            entityId: jobId,
            action: 'SCORING_WEIGHTS_UPDATED',
            newValue: weights,
            performedBy,
        }).catch(() => {})

        return job.scoringConfig?.weights ?? weights
    }

    /**
     * Get the full scoring config for a job.
     * @deprecated Use getWeights or access job.scoringConfig directly.
     * Kept for backward compat with ATS settings modal.
     */
    async getJobProfile(jobId: string, orgId: string) {
        // Try Job.scoringConfig first
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
            .select('scoringConfig requiredSkills experienceRange title')
            .lean()

        if ((job as any)?.scoringConfig?.thresholds) {
            return {
                _isFromJob: true,
                scoringConfig: (job as any).scoringConfig as IScoringConfig,
                requiredSkills: (job as any).requiredSkills ?? [],
                jobTitle: (job as any).title,
            }
        }

        // Legacy fallback: find or create a JobScreeningProfile
        let profile = await JobScreeningProfile.findOne({ jobId, organizationId: orgId })
        if (!profile) {
            profile = await JobScreeningProfile.create({
                jobId,
                organizationId: orgId,
                hardGates: {},
                weights:   {
                    skillWeight: 0.35, experienceWeight: 0.30,
                    projectWeight: 0.20, educationWeight: 0.10, bonusWeight: 0.05,
                },
                thresholds: { shortlist: 80, reviewZone: 60, autoReject: 0 },
            })
        }
        return profile
    }

    /**
     * Score a candidate against a job using V2 semantic engine.
     * Single entry point for all scoring — replaces direct registry calls in processors.
     */
    async score(
        parsedData: IResumeParsedData | undefined,
        scoringConfig: IScoringConfig,
        jobContext: V2JobContext,
    ): Promise<V2ScoringResult> {
        const { weights } = scoringConfig
        return scoreCandidate(parsedData, jobContext, {
            skillWeight:       weights.skills,
            experienceWeight:  weights.experience,
            projectWeight:     weights.projects,
            educationWeight:   weights.education,
            signalBoostWeight: weights.signalBoost,
        })
    }

    /**
     * Update job profile (supports legacy profile updates via existing ATS settings modal).
     * Syncs changes to Job.scoringConfig if job exists.
     */
    async updateJobProfile(jobId: string, orgId: string, data: Record<string, unknown>) {
        // Try to sync with Job.scoringConfig
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
        if (job) {
            const currentConfig = job.scoringConfig ?? { ...DEFAULT_SCORING_CONFIG }
            await JobModel.findOneAndUpdate(
                { _id: jobId, organizationId: orgId },
                { $set: { scoringConfig: currentConfig } },
                { new: true }
            )
        }

        // Also update legacy profile for backward compat
        const profile = await JobScreeningProfile.findOneAndUpdate(
            { jobId, organizationId: orgId },
            { $set: data },
            { new: true, upsert: true }
        )
        return profile
    }
}

export const scoringService = new ScoringService()
