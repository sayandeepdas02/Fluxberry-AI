/**
 * AI Intelligence Service — Phase 3
 *
 * Wraps and extends the existing Copilot + Scoring-V2 infrastructure.
 * All LLM calls fall back gracefully to deterministic output.
 *
 * Capabilities:
 *   1. Candidate Insights   — deep profile analysis, strengths/gaps, recommended next step
 *   2. Outreach Draft       — personalized outreach email for passive candidates
 *   3. Job Ranking          — ranked candidate list with fit explanations
 *   4. Hiring Bottlenecks   — org-level pipeline analysis + actionable recommendations
 *   5. Skill Gap Analysis   — candidate vs. job requirements delta
 *   6. Recruiter Copilot    — org-aware chat assistant (extends job-scoped copilot)
 *   7. Pipeline Optimization— per-job stage suggestions
 */

import OpenAI from 'openai'
import redis from '../../jobs/redis.js'
import {
    Job as JobModel, Candidate, JobApplication, ApplicationStatus,
    StageHistory,
} from '../../database/models/index.js'
import { ScreeningResult, ScreeningStatus } from '../ats-screening/models/screening-result.model.js'
import { analyticsService } from '../analytics/analytics.service.js'
import { AppError } from '../../common/errors/index.js'
import mongoose from 'mongoose'

// ──────────────────────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────────────────────

export interface CandidateInsights {
    summary: string
    strengths: string[]
    gaps: string[]
    redFlags: string[]
    recommendedAction: string
    fitScore?: number
    fitLabel?: 'strong' | 'good' | 'potential' | 'weak'
    skillsPresent: string[]
    skillsMissing: string[]
}

export interface OutreachDraft {
    subject: string
    body: string
    tone: 'professional' | 'friendly' | 'urgent'
}

export interface RankedCandidate {
    candidateId: string
    name: string
    email: string
    score: number
    fitLabel: CandidateInsights['fitLabel']
    fitExplanation: string
    topSkills: string[]
    gaps: string[]
}

export interface HiringBottleneck {
    stage: string
    issue: string
    severity: 'critical' | 'high' | 'medium'
    suggestion: string
    metric?: string
}

export interface SkillGapAnalysis {
    requiredSkills: string[]
    presentSkills: string[]
    missingSkills: string[]
    matchPercentage: number
    summary: string
}

export interface PipelineOptimization {
    jobTitle: string
    observations: string[]
    suggestions: string[]
    urgentActions: string[]
}

// ──────────────────────────────────────────────────────────────
// Deterministic helpers
// ──────────────────────────────────────────────────────────────

function fitLabelFromScore(score: number): CandidateInsights['fitLabel'] {
    if (score >= 80) return 'strong'
    if (score >= 65) return 'good'
    if (score >= 45) return 'potential'
    return 'weak'
}

function deterministicInsights(
    breakdown: Record<string, number>,
    finalScore: number,
    requiredSkills: string[],
    parsedSkills: string[],
): Omit<CandidateInsights, 'summary' | 'recommendedAction'> {
    const skill = breakdown.skillScore ?? 0
    const exp   = breakdown.experienceScore ?? 0
    const proj  = breakdown.projectScore ?? 0
    const edu   = breakdown.educationScore ?? 0

    const strengths: string[] = []
    const gaps: string[] = []
    const redFlags: string[] = []

    if (skill >= 75) strengths.push('Strong skill alignment with the role')
    else if (skill >= 55) strengths.push('Partial skill match — core competencies present')
    if (exp >= 75) strengths.push('Experience level exceeds role requirements')
    else if (exp >= 55) strengths.push('Relevant experience in the domain')
    if (proj >= 80) strengths.push('Highly relevant project portfolio')
    if (edu >= 75) strengths.push('Strong educational background')

    if (skill < 50) gaps.push('Key technical skills are partially missing')
    if (exp < 50) gaps.push('Experience is below the stated minimum')
    if (proj < 40) gaps.push('Limited directly relevant projects')

    if (finalScore < 40) redFlags.push('Overall match score is critically low')
    if (breakdown.confidenceScore !== undefined && breakdown.confidenceScore < 50)
        redFlags.push('Resume data may be incomplete or poorly structured')

    const lowerParsed = parsedSkills.map(s => s.toLowerCase())
    const skillsPresent = requiredSkills.filter(s => lowerParsed.includes(s.toLowerCase()))
    const skillsMissing = requiredSkills.filter(s => !lowerParsed.includes(s.toLowerCase()))

    return {
        strengths,
        gaps,
        redFlags,
        fitScore: Math.round(finalScore),
        fitLabel: fitLabelFromScore(finalScore),
        skillsPresent,
        skillsMissing,
    }
}

// ──────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────

class AIIntelligenceService {

    private openai(): OpenAI | null {
        const key = process.env.OPENAI_API_KEY
        return key ? new OpenAI({ apiKey: key }) : null
    }

    private async llm(messages: OpenAI.ChatCompletionMessageParam[], maxTokens = 400, temperature = 0.3): Promise<string | null> {
        const client = this.openai()
        if (!client) return null
        try {
            const res = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages,
                max_tokens: maxTokens,
                temperature,
            })
            return res.choices[0]?.message?.content?.trim() || null
        } catch {
            return null
        }
    }

    // ─── 1. Candidate Insights ────────────────────────────────

    async getCandidateInsights(candidateId: string, organizationId: string, jobId?: string): Promise<CandidateInsights> {
        const cacheKey = `ai:insights:${candidateId}:${jobId || 'general'}`
        const cached = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached)

        const [candidate, screening, job] = await Promise.all([
            Candidate.findOne({ _id: candidateId, organizationId }).select('firstName lastName email tags parsedResumeData').lean(),
            jobId ? ScreeningResult.findOne({ candidateId, jobId, organizationId }).lean() : null,
            jobId ? JobModel.findOne({ _id: jobId, organizationId }).select('title requiredSkills').lean() : null,
        ])

        if (!candidate) throw AppError.notFound('Candidate')

        const requiredSkills: string[] = (job as any)?.requiredSkills || []
        const parsedResume = (candidate as any).parsedResumeData || {}
        const parsedSkills: string[] = parsedResume.skills || []

        let breakdown: Record<string, number> = {}
        let finalScore = 0

        if (screening) {
            breakdown = (screening as any).scoreBreakdown || {}
            finalScore = (screening as any).finalScore || 0
        }

        const det = deterministicInsights(breakdown, finalScore, requiredSkills, parsedSkills)

        const name = [(candidate as any).firstName, (candidate as any).lastName].filter(Boolean).join(' ') || 'the candidate'

        // LLM-enhanced summary + recommendation
        const prompt = jobId
            ? `You are a senior technical recruiter. Given this candidate data, write:
1. A 2-3 sentence summary of the candidate's fit for the ${(job as any)?.title || 'role'}
2. A recommended next action (one sentence)
Format: JSON {"summary": "...", "recommendedAction": "..."}
Data: ${JSON.stringify({ name, score: finalScore, breakdown, requiredSkills: requiredSkills.slice(0, 5), skillsPresent: det.skillsPresent, skillsMissing: det.skillsMissing })}`
            : `You are a senior recruiter. Summarize this candidate profile in 2-3 sentences. Format: JSON {"summary": "...", "recommendedAction": "..."}
Data: ${JSON.stringify({ name, skills: parsedSkills.slice(0, 8), tags: (candidate as any).tags })}`

        const llmResponse = await this.llm([{ role: 'user', content: prompt }], 200, 0.2)
        let summary = `${name} is a ${det.fitLabel} match.`
        let recommendedAction = det.fitLabel === 'strong' || det.fitLabel === 'good'
            ? 'Schedule a screening call within the next 48 hours.'
            : 'Review manually before proceeding to interview.'

        if (llmResponse) {
            try {
                const parsed = JSON.parse(llmResponse.replace(/```json?\n?|```/g, '').trim())
                if (parsed.summary) summary = parsed.summary
                if (parsed.recommendedAction) recommendedAction = parsed.recommendedAction
            } catch { /* use deterministic */ }
        }

        const result: CandidateInsights = { ...det, summary, recommendedAction }
        await redis.set(cacheKey, JSON.stringify(result), 'EX', 600)
        return result
    }

    // ─── 2. Outreach Draft ────────────────────────────────────

    async generateOutreachDraft(candidateId: string, organizationId: string, jobId: string): Promise<OutreachDraft> {
        const [candidate, job] = await Promise.all([
            Candidate.findOne({ _id: candidateId, organizationId }).select('firstName lastName email parsedResumeData').lean(),
            JobModel.findOne({ _id: jobId, organizationId }).select('title department location requiredSkills').lean(),
        ])

        if (!candidate || !job) throw AppError.notFound('Candidate or job')

        const name = (candidate as any).firstName || 'there'
        const jobTitle = (job as any).title || 'this role'
        const dept = (job as any).department || ''
        const loc = (job as any).location || ''
        const skills = ((candidate as any).parsedResumeData?.skills || []).slice(0, 4).join(', ')

        const fallback: OutreachDraft = {
            subject: `Exciting opportunity: ${jobTitle} at our company`,
            body: `Hi ${name},\n\nI came across your profile and was impressed by your background${skills ? ` in ${skills}` : ''}. We have an exciting ${jobTitle} opportunity${dept ? ` on our ${dept} team` : ''}${loc ? ` in ${loc}` : ''} that I think could be a great fit for your experience.\n\nWould you be open to a quick 20-minute call this week to learn more?\n\nBest regards`,
            tone: 'professional',
        }

        const prompt = `You are a recruiter writing a personalized outreach to a passive candidate.
Write a concise, genuine outreach email. Format as JSON: {"subject": "...", "body": "...", "tone": "professional|friendly"}
Context: ${JSON.stringify({ candidateName: name, jobTitle, department: dept, location: loc, candidateSkills: skills })}`

        const llmResponse = await this.llm([{ role: 'user', content: prompt }], 350, 0.5)
        if (llmResponse) {
            try {
                const parsed = JSON.parse(llmResponse.replace(/```json?\n?|```/g, '').trim())
                if (parsed.subject && parsed.body) return parsed as OutreachDraft
            } catch { /* use fallback */ }
        }

        return fallback
    }

    // ─── 3. Ranked Candidates for Job ─────────────────────────

    async getRankedCandidatesForJob(jobId: string, organizationId: string, limit = 20): Promise<RankedCandidate[]> {
        const cacheKey = `ai:ranked:${jobId}`
        const cached = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached)

        const [job, topResults] = await Promise.all([
            JobModel.findOne({ _id: jobId, organizationId }).select('title requiredSkills').lean(),
            ScreeningResult.find({
                jobId,
                organizationId,
                status: { $in: [ScreeningStatus.PASSED, ScreeningStatus.SCORED, 'SCORED'] },
            }).sort({ finalScore: -1 }).limit(limit).lean(),
        ])

        if (!job) throw AppError.notFound('Job')

        const candidateIds = topResults.map((r: any) => r.candidateId)
        const candidates = await Candidate.find({ _id: { $in: candidateIds }, organizationId })
            .select('firstName lastName email parsedResumeData').lean()
        const candidateMap = new Map(candidates.map((c: any) => [c._id.toString(), c]))

        const requiredSkills: string[] = (job as any).requiredSkills || []

        // Build ranked list with deterministic fit explanations
        const ranked: RankedCandidate[] = topResults.map((r: any) => {
            const c = candidateMap.get(r.candidateId.toString()) as any
            const name = c ? [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email : 'Unknown'
            const parsedSkills: string[] = c?.parsedResumeData?.skills || []
            const breakdown = r.scoreBreakdown || {}
            const score = Math.round(r.finalScore || 0)
            const fitLabel = fitLabelFromScore(score)

            const skillsPresent = requiredSkills.filter(s => parsedSkills.map(p => p.toLowerCase()).includes(s.toLowerCase()))
            const skillsMissing = requiredSkills.filter(s => !parsedSkills.map(p => p.toLowerCase()).includes(s.toLowerCase()))

            const skill = Math.round(breakdown.skillScore ?? 0)
            const exp   = Math.round(breakdown.experienceScore ?? 0)
            const fitExplanation = fitLabel === 'strong'
                ? `Strong match — ${skill}% skill alignment, ${exp}% experience score. ${skillsPresent.length > 0 ? `Covers: ${skillsPresent.slice(0, 3).join(', ')}.` : ''}`
                : fitLabel === 'good'
                ? `Good fit — solid skill coverage (${skill}%) with ${exp}% experience match. Minor gaps in: ${skillsMissing.slice(0, 2).join(', ') || 'none'}.`
                : fitLabel === 'potential'
                ? `Potential hire — score ${score}, some gaps in ${skillsMissing.slice(0, 2).join(', ') || 'experience'}. Consider practical assessment.`
                : `Weak match — score ${score}, significant gaps. Manual review recommended.`

            return {
                candidateId: r.candidateId.toString(),
                name,
                email: c?.email || '',
                score,
                fitLabel,
                fitExplanation,
                topSkills: skillsPresent.slice(0, 4),
                gaps: skillsMissing.slice(0, 3),
            }
        })

        await redis.set(cacheKey, JSON.stringify(ranked), 'EX', 300)
        return ranked
    }

    // ─── 4. Hiring Bottleneck Detection ──────────────────────

    async detectHiringBottlenecks(organizationId: string): Promise<HiringBottleneck[]> {
        const cacheKey = `ai:bottlenecks:${organizationId}`
        const cached = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached)

        // Gather pipeline data
        const [funnel, timeToHire, kpis] = await Promise.all([
            analyticsService.getFunnelMetrics(organizationId),
            analyticsService.getTimeToHire(organizationId),
            analyticsService.getKPIs(organizationId),
        ])

        const bottlenecks: HiringBottleneck[] = []
        const dist = (funnel as any).stageDistribution || {}
        const conv = (funnel as any).conversionRates || {}
        const avgDays = Math.round((timeToHire as any).avgDays || 0)
        const awaiting = (kpis as any).awaitingReview?.value || 0

        // Deterministic bottleneck detection
        if (awaiting > 20) {
            bottlenecks.push({
                stage: 'Application Review',
                issue: `${awaiting} applications awaiting review`,
                severity: awaiting > 50 ? 'critical' : 'high',
                suggestion: 'Enable AI auto-screening to surface top candidates and reduce review queue.',
                metric: `${awaiting} pending`,
            })
        }

        if ((conv as any).appliedToInterview < 15) {
            bottlenecks.push({
                stage: 'Screening → Interview',
                issue: `Only ${(conv as any).appliedToInterview}% of applicants reach interview stage`,
                severity: (conv as any).appliedToInterview < 8 ? 'critical' : 'medium',
                suggestion: 'Review screening criteria — thresholds may be too strict or job description unclear.',
                metric: `${(conv as any).appliedToInterview}% conversion`,
            })
        }

        if (avgDays > 45) {
            bottlenecks.push({
                stage: 'Overall Pipeline',
                issue: `Average time-to-hire is ${avgDays} days — above industry benchmark of 30-40 days`,
                severity: avgDays > 60 ? 'critical' : 'high',
                suggestion: 'Identify stages with longest dwell times and set SLA alerts for each stage.',
                metric: `${avgDays} days avg`,
            })
        }

        if ((conv as any).interviewToOffer < 30) {
            bottlenecks.push({
                stage: 'Interview → Offer',
                issue: `${(conv as any).interviewToOffer}% interview-to-offer rate — high drop-off after interview`,
                severity: 'medium',
                suggestion: 'Improve structured interview feedback and calibrate hiring committee decisions.',
                metric: `${(conv as any).interviewToOffer}% rate`,
            })
        }

        if ((conv as any).offerToHired < 70) {
            bottlenecks.push({
                stage: 'Offer Acceptance',
                issue: `Only ${(conv as any).offerToHired}% of offers accepted`,
                severity: 'high',
                suggestion: 'Review offer competitiveness, compensation benchmarking, and time-to-offer speed.',
                metric: `${(conv as any).offerToHired}% accept rate`,
            })
        }

        // Enrich with LLM if available
        if (bottlenecks.length > 0) {
            const prompt = `You are a talent acquisition expert. Review these hiring bottlenecks and suggest one additional high-impact action for each.
Return as JSON array with same structure but add/improve "suggestion" fields only. Keep it concise.
Input: ${JSON.stringify(bottlenecks.slice(0, 4))}`

            const llmResponse = await this.llm([{ role: 'user', content: prompt }], 600, 0.3)
            if (llmResponse) {
                try {
                    const enriched = JSON.parse(llmResponse.replace(/```json?\n?|```/g, '').trim())
                    if (Array.isArray(enriched) && enriched.length === bottlenecks.slice(0, 4).length) {
                        enriched.forEach((e, i) => {
                            if (e.suggestion && bottlenecks[i]) bottlenecks[i].suggestion = e.suggestion
                        })
                    }
                } catch { /* use deterministic */ }
            }
        }

        if (bottlenecks.length === 0) {
            bottlenecks.push({
                stage: 'Pipeline Health',
                issue: 'No critical bottlenecks detected',
                severity: 'medium',
                suggestion: 'Pipeline is performing within normal ranges. Monitor weekly for emerging trends.',
            })
        }

        await redis.set(cacheKey, JSON.stringify(bottlenecks), 'EX', 600)
        return bottlenecks
    }

    // ─── 5. Skill Gap Analysis ────────────────────────────────

    async getSkillGapAnalysis(candidateId: string, jobId: string, organizationId: string): Promise<SkillGapAnalysis> {
        const [candidate, job, screening] = await Promise.all([
            Candidate.findOne({ _id: candidateId, organizationId }).select('firstName lastName parsedResumeData').lean(),
            JobModel.findOne({ _id: jobId, organizationId }).select('title requiredSkills optionalSkills').lean(),
            ScreeningResult.findOne({ candidateId, jobId, organizationId }).select('scoreBreakdown finalScore').lean(),
        ])

        if (!candidate || !job) throw AppError.notFound('Candidate or job')

        const required: string[] = (job as any).requiredSkills || []
        const optional: string[] = (job as any).optionalSkills || []
        const parsedSkills: string[] = ((candidate as any).parsedResumeData?.skills || []).map((s: string) => s.toLowerCase())

        const presentRequired = required.filter(s => parsedSkills.includes(s.toLowerCase()))
        const missingRequired = required.filter(s => !parsedSkills.includes(s.toLowerCase()))
        const presentOptional = optional.filter(s => parsedSkills.includes(s.toLowerCase()))

        const matchPercentage = required.length > 0
            ? Math.round((presentRequired.length / required.length) * 100)
            : 0

        let summary = `${presentRequired.length}/${required.length} required skills present (${matchPercentage}% match).`
        if (missingRequired.length > 0) {
            summary += ` Missing: ${missingRequired.slice(0, 3).join(', ')}${missingRequired.length > 3 ? ` +${missingRequired.length - 3} more` : ''}.`
        }
        if (presentOptional.length > 0) {
            summary += ` Bonus skills: ${presentOptional.slice(0, 2).join(', ')}.`
        }

        return {
            requiredSkills: required,
            presentSkills: [...presentRequired, ...presentOptional],
            missingSkills: missingRequired,
            matchPercentage,
            summary,
        }
    }

    // ─── 6. Org-Wide Recruiter Copilot Chat ───────────────────

    async recruiterCopilotChat(
        organizationId: string,
        messages: { role: 'user' | 'assistant'; content: string }[],
        context?: { jobId?: string; candidateId?: string }
    ): Promise<string> {
        const [kpis, funnel] = await Promise.all([
            analyticsService.getKPIs(organizationId),
            analyticsService.getFunnelMetrics(organizationId),
        ])

        const conv = (funnel as any).conversionRates || {}
        const kpiSummary = Object.entries(kpis as any).map(([k, v]: [string, any]) => `${v.label}: ${v.value}`).join(', ')

        let contextBlock = ''
        if (context?.jobId) {
            const job = await JobModel.findOne({ _id: context.jobId, organizationId }).select('title department status').lean()
            if (job) contextBlock = `\nCurrent job context: ${(job as any).title} (${(job as any).department || 'No department'}, ${(job as any).status})`
        }
        if (context?.candidateId) {
            const candidate = await Candidate.findOne({ _id: context.candidateId, organizationId }).select('firstName lastName email tags').lean()
            if (candidate) contextBlock += `\nCurrent candidate: ${(candidate as any).firstName || ''} ${(candidate as any).lastName || ''} (${(candidate as any).email})`
        }

        const systemPrompt = `You are Fluxberry AI Copilot, an intelligent recruiting assistant.

Organization Pipeline Overview:
- ${kpiSummary}
- Applied→Interview conversion: ${conv.appliedToInterview}%
- Interview→Offer conversion: ${conv.interviewToOffer}%
- Offer acceptance rate: ${conv.offerToHired}%
${contextBlock}

Instructions:
- Answer recruiter questions concisely and professionally
- Provide data-driven insights when available
- Suggest specific, actionable next steps
- Never hallucinate data not provided above`

        const client = this.openai()
        if (!client) {
            return "AI Copilot is not available — OpenAI API key is not configured. Please check your environment settings."
        }

        const apiMessages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
        ]

        try {
            const res = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: apiMessages,
                max_tokens: 600,
                temperature: 0.3,
            })
            return res.choices[0]?.message?.content?.trim() || "I couldn't generate a response."
        } catch (err) {
            console.error('[AI Intelligence] Copilot chat error:', err)
            throw AppError.internal('Failed to communicate with AI model')
        }
    }

    // ─── 7. Pipeline Optimization Suggestions ────────────────

    async getPipelineOptimizations(jobId: string, organizationId: string): Promise<PipelineOptimization> {
        const cacheKey = `ai:pipeline-opt:${jobId}`
        const cached = await redis.get(cacheKey)
        if (cached) return JSON.parse(cached)

        const [job, applications] = await Promise.all([
            JobModel.findOne({ _id: jobId, organizationId }).select('title requiredSkills').lean(),
            JobApplication.aggregate([
                { $match: { jobId: new mongoose.Types.ObjectId(jobId), organizationId: new mongoose.Types.ObjectId(organizationId) } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
        ])

        if (!job) throw AppError.notFound('Job')

        const statusCounts: Record<string, number> = {}
        applications.forEach((a: any) => { statusCounts[a._id] = a.count })

        const total = Object.values(statusCounts).reduce((a, b) => a + b, 0)
        const inInterview = statusCounts[ApplicationStatus.INTERVIEW] || 0
        const inOffer = statusCounts[ApplicationStatus.OFFER_SENT] || 0
        const hired = statusCounts[ApplicationStatus.HIRED] || 0
        const rejected = statusCounts[ApplicationStatus.REJECTED] || 0

        const observations: string[] = []
        const suggestions: string[] = []
        const urgentActions: string[] = []

        if (total === 0) {
            observations.push('No applications received yet.')
            suggestions.push('Promote the job posting on LinkedIn and relevant job boards.')
        } else {
            observations.push(`${total} total applications: ${inInterview} in interview, ${inOffer} at offer stage, ${hired} hired, ${rejected} rejected.`)

            if (inInterview > 5 && inOffer === 0) {
                suggestions.push('Multiple candidates in interview — schedule offer decisions to avoid candidate drop-off.')
                urgentActions.push('Fast-track offer decisions for interview-stage candidates.')
            }
            if (rejected > total * 0.6) {
                suggestions.push('High rejection rate — consider reviewing job requirements and screening thresholds.')
            }
            if (hired === 0 && total > 20) {
                suggestions.push('No hires yet with 20+ applications — review screening and interview pipeline stages.')
            }
        }

        const result: PipelineOptimization = {
            jobTitle: (job as any).title,
            observations,
            suggestions,
            urgentActions,
        }

        await redis.set(cacheKey, JSON.stringify(result), 'EX', 300)
        return result
    }
}

export const aiIntelligenceService = new AIIntelligenceService()
