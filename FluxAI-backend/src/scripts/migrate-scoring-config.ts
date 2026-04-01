/**
 * Migration: JobScreeningProfile → Job.scoringConfig
 *
 * This script is IDEMPOTENT — safe to run multiple times.
 * It copies scoring configuration from JobScreeningProfile into Job.scoringConfig
 * for any Job that doesn't yet have scoringConfig populated.
 *
 * Usage:
 *   npx tsx src/scripts/migrate-scoring-config.ts
 *   npx tsx src/scripts/migrate-scoring-config.ts --dry-run
 *   npx tsx src/scripts/migrate-scoring-config.ts --force    # re-migrate all jobs
 *
 * Safe to run: Does NOT delete JobScreeningProfile documents.
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { Job } from '../database/models/index.js'
import { JobScreeningProfile } from '../modules/ats-screening/models/job-screening-profile.model.js'
import { normalizeSkills } from '../modules/ats-screening/scoring-v2/skill-normalizer.js'
import {
    DEFAULT_SCORING_CONFIG,
    fromLegacyProfile,
    type IScoringConfig,
} from '../modules/ats-screening/scoring-config.types.js'

// ──────────────────────────────────────────────────────────────
// Args
// ──────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes('--dry-run')
const isForce  = process.argv.includes('--force')

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function log(msg: string, ...args: unknown[]) {
    console.log(`[migrate-scoring-config] ${msg}`, ...args)
}

function warn(msg: string, ...args: unknown[]) {
    console.warn(`[migrate-scoring-config] ⚠️  ${msg}`, ...args)
}

// ──────────────────────────────────────────────────────────────
// Core migration function for a single Job
// ──────────────────────────────────────────────────────────────

async function migrateJob(job: any): Promise<{ status: 'migrated' | 'default' | 'skipped' | 'dry-run' }> {
    const jobId = job._id.toString()

    // Skip if already migrated (unless --force)
    if (!isForce && job.scoringConfig?.thresholds) {
        return { status: 'skipped' }
    }

    // Look up the corresponding JobScreeningProfile
    const profile = await JobScreeningProfile.findOne({
        jobId: job._id,
        organizationId: job.organizationId,
    })

    let scoringConfig: IScoringConfig

    if (profile) {
        scoringConfig = fromLegacyProfile(profile)
        log(`[${jobId}] Found profile → migrating from profile`)
    } else {
        scoringConfig = { ...DEFAULT_SCORING_CONFIG }
        log(`[${jobId}] No profile found → applying DEFAULT_SCORING_CONFIG`)
    }

    // Normalize skills and sync into hardGates
    const requiredSkills = normalizeSkills(job.requiredSkills ?? [])
    scoringConfig.hardGates.requiredSkills = requiredSkills.length > 0
        ? requiredSkills
        : (profile?.requiredSkills ? normalizeSkills(profile.requiredSkills) : [])

    // Sync experience min from experienceRange if present
    if (job.experienceRange?.min != null) {
        scoringConfig.hardGates.minimumExperienceYears = job.experienceRange.min
    }

    if (isDryRun) {
        log(`[${jobId}] DRY-RUN → would write:`, JSON.stringify(scoringConfig, null, 2))
        return { status: 'dry-run' }
    }

    // Write to DB
    await Job.findByIdAndUpdate(job._id, {
        $set: {
            scoringConfig,
            // Normalize skills on the Job itself
            ...(requiredSkills.length > 0 ? { requiredSkills } : {}),
        },
    })

    return { status: profile ? 'migrated' : 'default' }
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

async function run() {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
        console.error('MONGODB_URI env var not set')
        process.exit(1)
    }

    log(`Connecting to MongoDB...`)
    await mongoose.connect(mongoUri)
    log(`Connected.`)

    if (isDryRun)  log(`DRY-RUN mode: no writes will be made`)
    if (isForce)   log(`FORCE mode: re-migrating all jobs`)

    // Determine scope
    const filter = isForce ? {} : { $or: [{ scoringConfig: { $exists: false } }, { 'scoringConfig.thresholds': { $exists: false } }] }
    const total = await Job.countDocuments(filter)
    log(`Found ${total} jobs to migrate`)

    if (total === 0) {
        log(`Nothing to do. All jobs already have scoringConfig.`)
        await mongoose.disconnect()
        return
    }

    const results = { migrated: 0, default: 0, skipped: 0, dryRun: 0, errors: 0 }

    // Process in batches of 100
    const BATCH_SIZE = 100
    let processed = 0

    while (processed < total) {
        const batch = await Job.find(filter).skip(processed).limit(BATCH_SIZE).lean()
        if (batch.length === 0) break

        for (const job of batch) {
            try {
                const result = await migrateJob(job)
                if (result.status === 'migrated')  results.migrated++
                if (result.status === 'default')   results.default++
                if (result.status === 'skipped')   results.skipped++
                if (result.status === 'dry-run')   results.dryRun++
            } catch (err) {
                warn(`Failed to migrate job ${job._id}:`, err)
                results.errors++
            }
        }

        processed += batch.length
        log(`Progress: ${processed}/${total}`)
    }

    log(`─────────────────────────────────`)
    log(`Migration complete.`)
    log(`  Migrated from profile: ${results.migrated}`)
    log(`  Applied default config: ${results.default}`)
    log(`  Skipped (already done): ${results.skipped}`)
    log(`  Dry-run (not written):  ${results.dryRun}`)
    log(`  Errors:                 ${results.errors}`)
    if (results.errors > 0) {
        warn(`Some jobs failed to migrate — check logs above and re-run`)
    }

    await mongoose.disconnect()
    log(`Done.`)
}

run().catch((err) => {
    console.error('[migrate-scoring-config] Fatal error:', err)
    process.exit(1)
})
