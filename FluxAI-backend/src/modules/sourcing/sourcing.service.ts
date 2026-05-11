import { Types } from 'mongoose'
import { Candidate } from '../../database/models/index.js'
import { Prospect } from '../../database/models/prospect.models.js'
import { activityService } from '../activity/activity.service.js'
import crypto from 'crypto'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface LinkedInImportRow {
    firstName: string
    lastName: string
    email?: string
    company?: string
    role?: string
    location?: string
    linkedinUrl?: string
    skills?: string[]
}

export interface GitHubImportRow {
    username: string
    name?: string
    email?: string
    bio?: string
    company?: string
    location?: string
    repos?: number
    followers?: number
    profileUrl: string
    skills?: string[]
}

export interface BulkImportResult {
    total: number
    inserted: number
    duplicates: number
    errors: number
}

export interface DeduplicationResult {
    totalCandidates: number
    duplicatesFound: number
    mergedRecords: number
}

// ──────────────────────────────────────────────────────────────
// Sourcing Service
// ──────────────────────────────────────────────────────────────

class SourcingService {

    /**
     * Generate a dedup hash from normalized email.
     * Used to detect duplicates across sources.
     */
    private generateDedupHash(email: string): string {
        const normalized = email.trim().toLowerCase()
        return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 32)
    }

    // ── LinkedIn Import ──────────────────────────────────────

    async importLinkedInProfiles(organizationId: string, profiles: LinkedInImportRow[], userId: string): Promise<BulkImportResult> {
        let inserted = 0
        let duplicates = 0
        let errors = 0

        for (const profile of profiles) {
            try {
                const email = profile.email || `${profile.firstName?.toLowerCase()}.${profile.lastName?.toLowerCase()}@linkedin-import.placeholder`

                await Prospect.findOneAndUpdate(
                    { organizationId: new Types.ObjectId(organizationId), email },
                    {
                        $setOnInsert: {
                            organizationId: new Types.ObjectId(organizationId),
                            firstName: profile.firstName || '',
                            lastName: profile.lastName || '',
                            email,
                            company: profile.company,
                            role: profile.role,
                            location: profile.location,
                            skills: profile.skills || [],
                            source: 'linkedin',
                            status: 'new',
                            socialProfiles: { linkedin: profile.linkedinUrl },
                        },
                    },
                    { upsert: true, new: true, rawResult: true }
                ).then((result: any) => {
                    if (result.lastErrorObject?.updatedExisting) duplicates++
                    else inserted++
                })
            } catch {
                errors++
            }
        }

        await activityService.log({
            organizationId,
            entityType: 'sourcing',
            entityId: organizationId,
            eventType: 'LINKEDIN_IMPORT',
            actorType: 'user',
            performedBy: userId,
            metadata: { total: profiles.length, inserted, duplicates, errors },
        })

        return { total: profiles.length, inserted, duplicates, errors }
    }

    // ── GitHub Import ────────────────────────────────────────

    async importGitHubProfiles(organizationId: string, profiles: GitHubImportRow[], userId: string): Promise<BulkImportResult> {
        let inserted = 0
        let duplicates = 0
        let errors = 0

        for (const profile of profiles) {
            try {
                const email = profile.email || `${profile.username}@github-import.placeholder`
                const nameParts = (profile.name || profile.username).split(' ')

                await Prospect.findOneAndUpdate(
                    { organizationId: new Types.ObjectId(organizationId), email },
                    {
                        $setOnInsert: {
                            organizationId: new Types.ObjectId(organizationId),
                            firstName: nameParts[0] || profile.username,
                            lastName: nameParts.slice(1).join(' ') || '',
                            email,
                            company: profile.company,
                            location: profile.location,
                            skills: profile.skills || [],
                            source: 'github',
                            status: 'new',
                            socialProfiles: { github: profile.profileUrl },
                            enrichmentData: {
                                bio: profile.bio,
                                repos: profile.repos,
                                followers: profile.followers,
                            },
                        },
                    },
                    { upsert: true, new: true, rawResult: true }
                ).then((result: any) => {
                    if (result.lastErrorObject?.updatedExisting) duplicates++
                    else inserted++
                })
            } catch {
                errors++
            }
        }

        await activityService.log({
            organizationId,
            entityType: 'sourcing',
            entityId: organizationId,
            eventType: 'GITHUB_IMPORT',
            actorType: 'user',
            performedBy: userId,
            metadata: { total: profiles.length, inserted, duplicates, errors },
        })

        return { total: profiles.length, inserted, duplicates, errors }
    }

    // ── Bulk Resume Import ───────────────────────────────────

    async importBulkCandidates(organizationId: string, candidates: Array<{
        firstName: string; lastName: string; email: string; phone?: string;
        source?: string; resumeUrl?: string; tags?: string[]
    }>, userId: string): Promise<BulkImportResult> {
        let inserted = 0
        let duplicates = 0
        let errors = 0

        for (const cand of candidates) {
            try {
                const dedupHash = this.generateDedupHash(cand.email)

                const result = await Candidate.findOneAndUpdate(
                    { organizationId: new Types.ObjectId(organizationId), email: cand.email.trim().toLowerCase() },
                    {
                        $setOnInsert: {
                            organizationId: new Types.ObjectId(organizationId),
                            firstName: cand.firstName,
                            lastName: cand.lastName,
                            email: cand.email.trim().toLowerCase(),
                            phone: cand.phone,
                            source: cand.source || 'bulk_import',
                            resumeUrl: cand.resumeUrl,
                            tags: cand.tags || [],
                            dedupHash,
                        },
                    },
                    { upsert: true, new: true, rawResult: true }
                )
                if ((result as any).lastErrorObject?.updatedExisting) duplicates++
                else inserted++
            } catch {
                errors++
            }
        }

        return { total: candidates.length, inserted, duplicates, errors }
    }

    // ── Deduplication ────────────────────────────────────────

    async deduplicateCandidates(organizationId: string): Promise<DeduplicationResult> {
        const orgId = new Types.ObjectId(organizationId)

        // Find duplicate emails within the org
        const dupes = await Candidate.aggregate([
            { $match: { organizationId: orgId, isDeleted: false } },
            { $group: { _id: { $toLower: '$email' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
            { $match: { count: { $gt: 1 } } },
        ])

        let mergedRecords = 0

        for (const dupe of dupes) {
            const candidates = await Candidate.find({ _id: { $in: dupe.ids } }).sort({ createdAt: 1 }).lean()
            if (candidates.length < 2) continue

            // Keep the oldest record, merge data from newer ones
            const primary = candidates[0]
            const toMerge = candidates.slice(1)

            // Merge tags from all records
            const allTags = new Set<string>([...(primary.tags || [])])
            for (const c of toMerge) {
                (c.tags || []).forEach(t => allTags.add(t))
            }

            await Candidate.findByIdAndUpdate(primary._id, {
                $set: {
                    tags: Array.from(allTags),
                    dedupHash: this.generateDedupHash(primary.email),
                },
            })

            // Soft-delete the duplicates
            await Candidate.updateMany(
                { _id: { $in: toMerge.map(c => c._id) } },
                { $set: { isDeleted: true, deletedAt: new Date() } }
            )

            mergedRecords += toMerge.length
        }

        const totalCandidates = await Candidate.countDocuments({ organizationId: orgId, isDeleted: false })

        return { totalCandidates, duplicatesFound: dupes.length, mergedRecords }
    }

    // ── Campaign Tagging ─────────────────────────────────────

    async tagSourceCampaign(organizationId: string, candidateIds: string[], campaignTag: string) {
        const orgId = new Types.ObjectId(organizationId)
        const ids = candidateIds.map(id => new Types.ObjectId(id))

        const result = await Candidate.updateMany(
            { _id: { $in: ids }, organizationId: orgId },
            { $addToSet: { tags: campaignTag } }
        )

        return { modified: result.modifiedCount }
    }
}

export const sourcingService = new SourcingService()
