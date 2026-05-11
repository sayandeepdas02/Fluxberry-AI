/**
 * AI Ranking Service
 * Embedding-based candidate ranking using existing embeddingService.
 * Queue-backed: results materialized in AIRankingResult collection.
 * Falls back to deterministic scoring when OpenAI is unavailable.
 */

import { Job as JobModel, Candidate } from '../../../database/models/index.js'
import { ScreeningResult, ScreeningStatus } from '../../../modules/ats-screening/models/screening-result.model.js'
import { AIRankingResult, IAIRankingEntry } from '../../../database/models/ai-intelligence.models.js'
import { embeddingService } from '../../../modules/ats-screening/scoring-v2/embedding.service.js'
import { Types } from 'mongoose'

class AIRankingService {

    /**
     * Rank all scored candidates for a job using embedding similarity.
     * Falls back to finalScore-based ranking if embeddings fail.
     */
    async rankCandidatesForJob(jobId: string, orgId: string): Promise<any> {
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
            .select('title description requiredSkills optionalSkills department')
            .lean()
        if (!job) throw { code: 'NOT_FOUND', message: 'Job not found' }

        // Get all scored candidates
        const results = await ScreeningResult.find({
            jobId,
            organizationId: orgId,
            status: { $in: [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'] },
        })
            .sort({ finalScore: -1 })
            .limit(200) // Cap for performance
            .lean()

        if (results.length === 0) {
            return { rankings: [], totalCandidates: 0 }
        }

        // Load candidate data
        const candidateIds = results.map(r => r.candidateId)
        const candidates = await Candidate.find({ _id: { $in: candidateIds } })
            .select('firstName lastName email parsedResumeData')
            .lean()
        const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]))

        let rankings: IAIRankingEntry[]

        try {
            // Build job description embedding
            const jobText = [
                (job as any).title,
                (job as any).description?.substring(0, 500),
                ((job as any).requiredSkills || []).join(', '),
                ((job as any).optionalSkills || []).join(', '),
            ].filter(Boolean).join('. ')

            const jobEmbedding = await embeddingService.embed(jobText)

            // Build candidate profile embeddings
            const candidateTexts = results.map(r => {
                const c = candidateMap.get(r.candidateId.toString())
                const parsed = (c as any)?.parsedResumeData || {}
                return [
                    parsed.summary || '',
                    (parsed.skills || []).join(', '),
                    (parsed.experience || []).map((e: any) => e.title || '').join(', '),
                ].filter(Boolean).join('. ') || 'No profile data'
            })

            const candidateEmbeddings = await embeddingService.embedBatch(candidateTexts)

            // Score by cosine similarity, weighted with screening score
            const scored = results.map((r, i) => {
                const similarity = embeddingService.cosine(jobEmbedding, candidateEmbeddings[i])
                // Blend: 60% embedding similarity, 40% screening score
                const blendedScore = (similarity * 100 * 0.6) + ((r.finalScore ?? 0) * 0.4)
                const confidence = Math.min(95, Math.round((r.confidenceScore ?? 50) * (similarity > 0.5 ? 1.2 : 0.8)))

                return {
                    candidateId: r.candidateId,
                    score: Math.round(blendedScore * 10) / 10,
                    confidence,
                    similarity,
                    screeningScore: r.finalScore ?? 0,
                }
            })

            scored.sort((a, b) => b.score - a.score)

            rankings = scored.map((s, i) => ({
                candidateId: s.candidateId,
                score: s.score,
                confidence: s.confidence,
                explanation: `Embedding similarity: ${Math.round(s.similarity * 100)}%, Screening: ${s.screeningScore}`,
                rank: i + 1,
            }))
        } catch {
            // Deterministic fallback: rank by finalScore
            rankings = results.map((r, i) => ({
                candidateId: r.candidateId,
                score: r.finalScore ?? 0,
                confidence: Math.round(r.confidenceScore ?? 50),
                explanation: `Ranked by screening score (AI embeddings unavailable)`,
                rank: i + 1,
            }))
        }

        // Materialize result
        const expiry = new Date()
        expiry.setMinutes(expiry.getMinutes() + 30)

        await AIRankingResult.findOneAndUpdate(
            { jobId, organizationId: orgId },
            {
                $set: {
                    rankings,
                    totalCandidates: rankings.length,
                    isAIGenerated: true,
                    generatedAt: new Date(),
                    expiresAt: expiry,
                },
            },
            { upsert: true, new: true }
        )

        return { rankings: rankings.slice(0, 50), totalCandidates: rankings.length }
    }

    /**
     * Get cached ranking results for a job.
     */
    async getRankingResults(jobId: string, orgId: string) {
        const result = await AIRankingResult.findOne({ jobId, organizationId: orgId })
            .populate('rankings.candidateId', 'firstName lastName email')
            .lean()
        if (!result) return null
        return result
    }
}

export const aiRankingService = new AIRankingService()
