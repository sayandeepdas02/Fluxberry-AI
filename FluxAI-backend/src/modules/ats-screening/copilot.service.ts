/**
 * AI Hiring Copilot Service
 *
 * Architecture:
 *   1. Deterministic ranking — reads from ScreeningResult (NO re-scoring)
 *   2. Heuristic classification — pure rule-based, no LLM
 *   3. GPT-4o-mini explanations — only for top-5, only for summary sentence
 *
 * The Copilot NEVER overrides, changes, or re-computes scoring engine output.
 * It only reads, classifies, and explains.
 */

import { Job as JobModel, Candidate }    from '../../database/models/index.js'
import { ScreeningResult, ScreeningStatus } from './models/screening-result.model.js'
import redis from '../../jobs/redis.js'
import OpenAI from 'openai'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface CopilotRecommendation {
    candidateId:  string
    name:         string
    score:        number
    confidence:   number
    classification: 'strong' | 'high_potential' | 'borderline' | 'at_risk'
    reason:       string   // human-readable summary (1 sentence)
    riskFlags:    string[] // deterministic risk flags
    strengths:    string[] // from existing deterministic logic
    weaknesses:   string[] // from existing deterministic logic
    topSkills:    string[] // from skillMatchDetails
}

export interface CopilotOutput {
    topRecommendations: CopilotRecommendation[]
    insights:           string[]   // pool-level deterministic insights
    suggestedActions:   string[]   // deterministic action suggestions
    generatedAt:        string
    candidateCount:     number
    scoredCount:        number
}

export interface CandidateCopilotSummary {
    summary:     string
    riskFlags:   string[]
    topStrengths:string[]
    topWeaknesses: string[]
    classification: CopilotRecommendation['classification']
}

// ──────────────────────────────────────────────────────────────
// Heuristic Classification (100% deterministic)
// ──────────────────────────────────────────────────────────────

function classify(
    finalScore: number,
    confidenceScore: number,
    breakdown: Record<string, number>,
    hasHardGateFailure: boolean,
): CopilotRecommendation['classification'] {
    if (hasHardGateFailure) return 'at_risk'

    const skill   = breakdown.skillScore      ?? 0
    const project = breakdown.projectScore    ?? 0
    const exp     = breakdown.experienceScore ?? 0

    if (skill > 80 && project > 80) return 'strong'
    if (finalScore >= 75 && confidenceScore >= 70) return 'strong'
    if (exp < 50 && project > 75) return 'high_potential'
    if (finalScore >= 60) return 'borderline'
    return 'at_risk'
}

function deriveRiskFlags(
    finalScore: number,
    confidenceScore: number,
    breakdown: Record<string, number>,
    hasHardGateFailure: boolean,
    hardGateReason?: string,
): string[] {
    const flags: string[] = []
    if (hasHardGateFailure) {
        flags.push(hardGateReason ? `Failed hard gate: ${hardGateReason}` : 'Failed mandatory requirements')
    }
    if (confidenceScore < 60) flags.push('Low confidence — resume data may be incomplete')
    if ((breakdown.skillScore ?? 0) < 40) flags.push('Significant skill gap for this role')
    if ((breakdown.experienceScore ?? 0) < 40) flags.push('Experience below minimum requirement')
    if ((breakdown.projectScore ?? 0) < 30) flags.push('Limited relevant project work')
    return flags
}

function deriveStrengths(breakdown: Record<string, number>): string[] {
    const s: string[] = []
    if ((breakdown.skillScore ?? 0) >= 80) s.push('Strong technical skill match')
    else if ((breakdown.skillScore ?? 0) >= 70) s.push('Good alignment with required skills')
    if ((breakdown.experienceScore ?? 0) >= 80) s.push('Experience exceeds requirements')
    else if ((breakdown.experienceScore ?? 0) >= 70) s.push('Solid relevant experience')
    if ((breakdown.projectScore ?? 0) >= 85) s.push('Highly relevant project portfolio')
    else if ((breakdown.projectScore ?? 0) >= 70) s.push('Good project portfolio alignment')
    if ((breakdown.educationScore ?? 0) >= 80) s.push('Strong educational background')
    return s
}

function deriveWeaknesses(breakdown: Record<string, number>): string[] {
    const w: string[] = []
    if ((breakdown.skillScore ?? 0) < 60) w.push('Skills partially match requirements')
    if ((breakdown.experienceScore ?? 0) < 60) w.push('Experience below job requirements')
    if ((breakdown.projectScore ?? 0) < 50) w.push('Projects have limited role relevance')
    return w
}

function deriveReasonDeterministic(
    classification: CopilotRecommendation['classification'],
    breakdown: Record<string, number>,
    finalScore: number,
): string {
    const skill   = Math.round(breakdown.skillScore      ?? 0)
    const project = Math.round(breakdown.projectScore    ?? 0)
    const exp     = Math.round(breakdown.experienceScore ?? 0)

    switch (classification) {
        case 'strong':
            return `Top candidate — strong skill match (${skill}%) and solid project portfolio (${project}%). Score: ${finalScore}.`
        case 'high_potential':
            return `High potential — exceptional project work (${project}%) despite lower experience (${exp}%). Worth a conversation.`
        case 'borderline':
            return `Borderline — meets some criteria but has gaps. Score ${finalScore} — review recommended before decision.`
        case 'at_risk':
            return `At risk — significant gaps identified. Score: ${finalScore}. Manual review required.`
    }
}

// ──────────────────────────────────────────────────────────────
// Pool-level Insights (deterministic)
// ──────────────────────────────────────────────────────────────

function generatePoolInsights(
    results: any[],
    topN: any[],
    jobTitle: string,
): string[] {
    const insights: string[] = []
    const scored = results.filter(r =>
        [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'].includes(r.status)
    )
    const strongCount     = topN.filter(r => (r.finalScore ?? 0) >= 80).length
    const avgSkill        = scored.length > 0
        ? Math.round(scored.reduce((s, r) => s + (r.scoreBreakdown?.skillScore ?? 0), 0) / scored.length)
        : 0
    const avgExp          = scored.length > 0
        ? Math.round(scored.reduce((s, r) => s + (r.scoreBreakdown?.experienceScore ?? 0), 0) / scored.length)
        : 0
    const lowConfidence   = scored.filter(r => (r.confidenceScore ?? 0) < 60).length
    const hardGateFailed  = results.filter(r => r.status === ScreeningStatus.FAILED_GATE).length

    if (strongCount >= 3) {
        insights.push(`Strong applicant pool — ${strongCount} candidates score above 80 for ${jobTitle}.`)
    } else if (strongCount === 0 && scored.length > 0) {
        insights.push(`Competitive screening — no candidates currently score above 80. Lowering thresholds may surface more candidates.`)
    }

    if (avgSkill > 0) {
        insights.push(`Average skill match across scored candidates: ${avgSkill}%. ${avgSkill > 70 ? 'Pool is technically strong.' : 'Consider expanding the skill search.'}`)
    }

    if (avgExp < 50 && avgExp > 0) {
        insights.push(`Most applicants have lower experience scores (avg: ${avgExp}%). Consider prioritizing project work as a signal.`)
    }

    if (hardGateFailed > 0) {
        insights.push(`${hardGateFailed} candidate${hardGateFailed > 1 ? 's' : ''} failed mandatory requirements and were auto-rejected.`)
    }

    if (lowConfidence > 0 && scored.length > 0) {
        insights.push(`${lowConfidence} candidate${lowConfidence > 1 ? 's' : ''} have low confidence scores — their resumes may need manual review.`)
    }

    return insights.slice(0, 4)
}

function generateSuggestedActions(
    topN: any[],
    scored: any[],
    hardGateFailed: number,
): string[] {
    const actions: string[] = []
    const strongCandidates = topN.filter(r => (r.finalScore ?? 0) >= 75)

    if (strongCandidates.length > 0) {
        actions.push(`Schedule interviews with the top ${Math.min(strongCandidates.length, 3)} candidates first.`)
    }

    if (topN.some(r => (r.scoreBreakdown?.skillScore ?? 0) >= 80)) {
        actions.push('Focus interview questions on system design and architecture — top candidates show strong technical depth.')
    }

    if (topN.some(r => (r.scoreBreakdown?.experienceScore ?? 0) < 50 && (r.scoreBreakdown?.projectScore ?? 0) > 75)) {
        actions.push('Consider practical coding tasks for high-potential candidates with strong projects but less experience.')
    }

    if (scored.length === 0) {
        actions.push('Resume parsing is still in progress. Check back shortly for scored candidates.')
    } else if (scored.length < 5) {
        actions.push('Only a few candidates scored so far. More may be processing — results will update automatically.')
    }

    return actions.slice(0, 3)
}

// ──────────────────────────────────────────────────────────────
// LLM Layer (explanation generation only)
// ──────────────────────────────────────────────────────────────

class CopilotService {
    private getOpenAIClient(): OpenAI | null {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) return null
        return new OpenAI({ apiKey })
    }

    /**
     * Generate a 1-sentence Copilot summary for a single candidate via GPT-4o-mini.
     * Falls back to deterministic reason string if LLM is unavailable.
     */
    private async generateCandidateSummary(
        jobTitle: string,
        candidateName: string,
        breakdown: Record<string, number>,
        skills: string[],
        classification: CopilotRecommendation['classification'],
        deterministicReason: string,
    ): Promise<string> {
        const client = this.getOpenAIClient()
        if (!client) return deterministicReason

        const prompt = {
            role: 'system' as const,
            content:
                'You are a hiring assistant. Write a single factual sentence (max 25 words) summarising why this candidate is or is not a good fit. No fluff, no hallucination. Only use the provided data.',
        }
        const user = {
            role: 'user' as const,
            content: JSON.stringify({
                job: jobTitle,
                candidate: candidateName,
                classification,
                skillScore:      Math.round(breakdown.skillScore ?? 0),
                experienceScore: Math.round(breakdown.experienceScore ?? 0),
                projectScore:    Math.round(breakdown.projectScore ?? 0),
                topSkills: skills.slice(0, 4),
            }),
        }

        try {
            const resp = await client.chat.completions.create({
                model:       'gpt-4o-mini',
                messages:    [prompt, user],
                max_tokens:  60,
                temperature: 0.2,
            })
            return resp.choices[0]?.message?.content?.trim() || deterministicReason
        } catch {
            return deterministicReason
        }
    }

    /**
     * Core Copilot function.
     * Reads top-10 results, ranks deterministically, generates LLM summaries for top-5 in parallel.
     * Result is cached in Redis for 5 minutes.
     */
    async generateCopilotInsights(jobId: string, orgId: string): Promise<CopilotOutput> {
        const cacheKey = `copilot:insights:${jobId}`
        const cached   = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached) as CopilotOutput

        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
            .select('title requiredSkills scoringConfig').lean()

        const jobTitle     = (job as any)?.title || 'this role'
        const requiredSkills: string[] = (job as any)?.requiredSkills || []

        // Fetch all results for pool stats, then top-10 for recommendations
        const [allResults, top10] = await Promise.all([
            ScreeningResult.find({ jobId, organizationId: orgId })
                .select('status finalScore confidenceScore scoreBreakdown hardGateFailureReason candidateId')
                .lean(),
            ScreeningResult.find({
                jobId,
                organizationId: orgId,
                status: { $in: [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'] },
            })
                .sort({ finalScore: -1, confidenceScore: -1 })
                .limit(10)
                .lean(),
        ])

        // Populate candidate names for top-10
        const candidateIds = top10.map(r => r.candidateId)
        const candidates   = await Candidate.find({ _id: { $in: candidateIds } })
            .select('firstName lastName email skillMatchDetails').lean()
        const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]))

        const scored = allResults.filter(r =>
            [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'].includes(r.status))
        const hardGateFailed = allResults.filter(r => r.status === ScreeningStatus.FAILED_GATE).length

        // Build top-5 recommendations with deterministic data first
        const top5 = top10.slice(0, 5)
        const recsBefore: Omit<CopilotRecommendation, 'reason'>[] = top5.map(r => {
            const c          = candidateMap.get(r.candidateId.toString())
            const breakdown  = (r.scoreBreakdown as any) || {}
            const hasGateFail = r.status === ScreeningStatus.FAILED_GATE

            return {
                candidateId:    r.candidateId.toString(),
                name:           c ? `${(c as any).firstName || ''} ${(c as any).lastName || ''}`.trim() || (c as any).email : 'Unknown',
                score:          Math.round(r.finalScore ?? 0),
                confidence:     Math.round(r.confidenceScore ?? 0),
                classification: classify(r.finalScore ?? 0, r.confidenceScore ?? 0, breakdown, hasGateFail),
                riskFlags:      deriveRiskFlags(r.finalScore ?? 0, r.confidenceScore ?? 0, breakdown, hasGateFail, r.hardGateFailureReason),
                strengths:      deriveStrengths(breakdown),
                weaknesses:     deriveWeaknesses(breakdown),
                topSkills:      requiredSkills.slice(0, 3),
            }
        })

        // Generate LLM summaries in parallel (non-blocking, falls back to deterministic)
        const summaries = await Promise.all(
            top5.map(async (r, i) => {
                const rec           = recsBefore[i]
                const breakdown     = (r.scoreBreakdown as any) || {}
                const deterministic = deriveReasonDeterministic(rec.classification, breakdown, r.finalScore ?? 0)
                return this.generateCandidateSummary(
                    jobTitle,
                    rec.name,
                    breakdown,
                    requiredSkills,
                    rec.classification,
                    deterministic,
                )
            })
        )

        const topRecommendations: CopilotRecommendation[] = recsBefore.map((rec, i) => ({
            ...rec,
            reason: summaries[i],
        }))

        const output: CopilotOutput = {
            topRecommendations,
            insights:        generatePoolInsights(allResults, top10, jobTitle),
            suggestedActions:generateSuggestedActions(top10, scored, hardGateFailed),
            generatedAt:     new Date().toISOString(),
            candidateCount:  allResults.length,
            scoredCount:     scored.length,
        }

        // Cache for 5 minutes
        await redis.set(cacheKey, JSON.stringify(output), 'EX', 300)
        return output
    }

    /**
     * Get per-candidate Copilot summary (for breakdown modal).
     * Cached 10 minutes.
     */
    async getCandidateSummary(jobId: string, candidateId: string, orgId: string): Promise<CandidateCopilotSummary> {
        const cacheKey = `copilot:candidate:${jobId}:${candidateId}`
        const cached   = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached) as CandidateCopilotSummary

        const [result, job] = await Promise.all([
            ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
                .select('finalScore confidenceScore scoreBreakdown status hardGateFailureReason')
                .lean(),
            JobModel.findOne({ _id: jobId, organizationId: orgId })
                .select('title requiredSkills').lean(),
        ])

        if (!result) throw { code: 'NOT_FOUND', message: 'Result not found' }

        const jobTitle  = (job as any)?.title || 'this role'
        const skills    = (job as any)?.requiredSkills || []
        const breakdown = (result as any).scoreBreakdown || {}
        const hasGate   = result.status === ScreeningStatus.FAILED_GATE

        const classification = classify(result.finalScore ?? 0, result.confidenceScore ?? 0, breakdown, hasGate)
        const riskFlags      = deriveRiskFlags(result.finalScore ?? 0, result.confidenceScore ?? 0, breakdown, hasGate, (result as any).hardGateFailureReason)
        const topStrengths   = deriveStrengths(breakdown)
        const topWeaknesses  = deriveWeaknesses(breakdown)
        const deterministic  = deriveReasonDeterministic(classification, breakdown, result.finalScore ?? 0)

        const cand = await Candidate.findById(candidateId).select('firstName lastName').lean()
        const name = cand ? `${(cand as any).firstName || ''} ${(cand as any).lastName || ''}`.trim() : 'Candidate'

        const summary = await this.generateCandidateSummary(jobTitle, name, breakdown, skills, classification, deterministic)

        const output: CandidateCopilotSummary = { summary, riskFlags, topStrengths, topWeaknesses, classification }
        await redis.set(cacheKey, JSON.stringify(output), 'EX', 600)
        return output
    }

    /**
     * Generate tailored interview questions (LLM, falls back to generic).
     * NOT cached — regenerated on each request for freshness.
     */
    async generateInterviewQuestions(jobId: string, candidateId: string, orgId: string): Promise<string[]> {
        const [result, job] = await Promise.all([
            ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId })
                .select('scoreBreakdown finalScore').lean(),
            JobModel.findOne({ _id: jobId, organizationId: orgId })
                .select('title requiredSkills optionalSkills department').lean(),
        ])

        if (!result || !job) throw { code: 'NOT_FOUND', message: 'Result or job not found' }

        const jobTitle    = (job as any).title || 'Software Engineer'
        const department  = (job as any).department || ''
        const required    = (job as any).requiredSkills   || []
        const optional    = (job as any).optionalSkills   || []
        const breakdown   = (result as any).scoreBreakdown || {}

        const skillScore  = Math.round(breakdown.skillScore ?? 50)
        const expScore    = Math.round(breakdown.experienceScore ?? 50)
        const projScore   = Math.round(breakdown.projectScore ?? 50)

        // Deterministic fallback questions
        const fallback = [
            `Walk me through your experience with ${required[0] ?? 'your core technical skills'}.`,
            `Describe the most complex project you've built in a ${department || jobTitle} context.`,
            `How do you approach ${expScore < 60 ? 'ramping up quickly in a new codebase' : 'mentoring junior team members'}?`,
            `What's your process for ensuring code quality and maintainability?`,
            `How do you handle disagreements about technical decisions with teammates?`,
        ]

        const client = this.getOpenAIClient()
        if (!client) return fallback

        try {
            const resp = await client.chat.completions.create({
                model:       'gpt-4o-mini',
                temperature: 0.4,
                max_tokens:  400,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a technical interviewer. Generate exactly 5 targeted interview questions as a JSON array of strings. Questions must be specific, based on the candidate data. No numbering. No extra text.',
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            role: jobTitle,
                            department,
                            requiredSkills: required.slice(0, 5),
                            optionalSkills: optional.slice(0, 3),
                            candidateProfile: {
                                skillScore,
                                experienceScore: expScore,
                                projectScore:    projScore,
                                overallScore:    Math.round((result as any).finalScore ?? 0),
                                gaps: skillScore < 70 ? 'some skill gaps' : 'strong skill match',
                            },
                        }),
                    },
                ],
            })

            const raw = resp.choices[0]?.message?.content?.trim() || ''
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length >= 3) {
                return parsed.slice(0, 5).map(String)
            }
            return fallback
        } catch {
            return fallback
        }
    }

    /**
     * Interactive Chat with Copilot using Job and Candidate context
     */
    async chatWithCopilot(jobId: string, orgId: string, messages: { role: string; content: string }[]): Promise<string> {
        const job = await JobModel.findOne({ _id: jobId, organizationId: orgId })
            .select('title requiredSkills department').lean()
        if (!job) throw { code: 'NOT_FOUND', message: 'Job not found' }

        const top10 = await ScreeningResult.find({
            jobId,
            organizationId: orgId,
            status: { $in: [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'] },
        })
            .sort({ finalScore: -1 })
            .limit(10)
            .lean()

        const candidateIds = top10.map(r => r.candidateId)
        const candidates = await Candidate.find({ _id: { $in: candidateIds } })
            .select('firstName lastName email').lean()
        const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]))

        const candidateContext = top10.map((r: any) => {
            const c = candidateMap.get(r.candidateId.toString())
            const name = c ? `${(c as any).firstName || ''} ${(c as any).lastName || ''}`.trim() || (c as any).email : 'Unknown'
            const skillScore = Math.round(r.scoreBreakdown?.skillScore || 0)
            const expScore = Math.round(r.scoreBreakdown?.experienceScore || 0)
            const projScore = Math.round(r.scoreBreakdown?.projectScore || 0)
            return `- ${name}: Score ${Math.round(r.finalScore || 0)}, Skills ${skillScore}/100, Exp ${expScore}/100, Proj ${projScore}/100`
        }).join('\n')

        const jobTitle = (job as any).title || 'the role'
        const reqSkills = ((job as any).requiredSkills || []).join(', ')

        const systemPrompt = `You are Fluxberry AI Copilot, a senior hiring assistant.
You are helping the recruiter evaluate candidates for the "${jobTitle}" position.
Required Skills: ${reqSkills || 'None specified'}

Current Top Candidates in ATS:
${candidateContext || 'No candidates scored yet.'}

Instructions:
1. Answer the recruiter's questions concisely.
2. Use the provided candidate context to answer questions about the candidate pool.
3. Be professional and objective.`

        const client = this.getOpenAIClient()
        if (!client) throw { code: 'INTERNAL_ERROR', message: 'OpenAI not configured' }

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }))
        ]

        try {
            const resp = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: apiMessages as any,
                temperature: 0.3,
                max_tokens: 500
            })
            return resp.choices[0]?.message?.content?.trim() || "I couldn't generate a response."
        } catch (error) {
            console.error('[Copilot Service] Chat error:', error)
            throw { code: 'INTERNAL_ERROR', message: 'Failed to communicate with AI model' }
        }
    }

    /** Invalidate cached copilot output when scoring changes */
    async invalidateCache(jobId: string, candidateId?: string) {
        await redis.del(`copilot:insights:${jobId}`)
        if (candidateId) {
            await redis.del(`copilot:candidate:${jobId}:${candidateId}`)
        }
    }
}

export const copilotService = new CopilotService()
