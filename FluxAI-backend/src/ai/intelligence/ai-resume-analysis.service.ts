/**
 * AI Skill Gap Analysis Service
 * Analyzes gaps between candidate skills and job requirements.
 * Deterministic core with optional LLM explanation layer.
 */

import OpenAI from 'openai'
import { Job as JobModel, Candidate } from '../../../database/models/index.js'
import { ScreeningResult } from '../../../modules/ats-screening/models/screening-result.model.js'

interface SkillGap {
    skill: string
    status: 'matched' | 'partial' | 'missing'
    candidateEvidence?: string
    importance: 'required' | 'optional'
}

interface SkillGapAnalysis {
    candidateId: string
    jobId: string
    gaps: SkillGap[]
    overallFitPercentage: number
    summary: string
    recommendations: string[]
    isAIGenerated: boolean
}

class AIResumeAnalysisService {
    private getClient(): OpenAI | null {
        const key = process.env.OPENAI_API_KEY
        return key ? new OpenAI({ apiKey: key }) : null
    }

    async analyzeSkillGaps(candidateId: string, jobId: string, orgId: string): Promise<SkillGapAnalysis> {
        const [job, candidate, screening] = await Promise.all([
            JobModel.findOne({ _id: jobId, organizationId: orgId }).select('title requiredSkills optionalSkills').lean(),
            Candidate.findOne({ _id: candidateId, organizationId: orgId }).select('parsedResumeData').lean(),
            ScreeningResult.findOne({ candidateId, jobId, organizationId: orgId }).select('scoreBreakdown skillMatchDetails finalScore').lean(),
        ])

        if (!job) throw { code: 'NOT_FOUND', message: 'Job not found' }
        if (!candidate) throw { code: 'NOT_FOUND', message: 'Candidate not found' }

        const requiredSkills: string[] = (job as any).requiredSkills || []
        const optionalSkills: string[] = (job as any).optionalSkills || []
        const candidateSkills: string[] = ((candidate as any).parsedResumeData?.skills || []).map((s: string) => s.toLowerCase())
        const matchDetails = (screening as any)?.skillMatchDetails || []

        // Deterministic gap analysis
        const gaps: SkillGap[] = []

        for (const skill of requiredSkills) {
            const match = matchDetails.find((m: any) => m.skill?.toLowerCase() === skill.toLowerCase())
            const directMatch = candidateSkills.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))

            if (match?.similarity > 0.7 || directMatch) {
                gaps.push({ skill, status: 'matched', candidateEvidence: match?.bestMatch || skill, importance: 'required' })
            } else if (match?.similarity > 0.4) {
                gaps.push({ skill, status: 'partial', candidateEvidence: match?.bestMatch, importance: 'required' })
            } else {
                gaps.push({ skill, status: 'missing', importance: 'required' })
            }
        }

        for (const skill of optionalSkills) {
            const directMatch = candidateSkills.some(cs => cs.includes(skill.toLowerCase()) || skill.toLowerCase().includes(cs))
            gaps.push({
                skill,
                status: directMatch ? 'matched' : 'missing',
                importance: 'optional',
            })
        }

        const matchedRequired = gaps.filter(g => g.importance === 'required' && g.status === 'matched').length
        const totalRequired = gaps.filter(g => g.importance === 'required').length
        const overallFitPercentage = totalRequired > 0 ? Math.round((matchedRequired / totalRequired) * 100) : 0

        // Deterministic recommendations
        const recommendations: string[] = []
        const missingRequired = gaps.filter(g => g.importance === 'required' && g.status === 'missing')
        if (missingRequired.length > 0) {
            recommendations.push(`Missing ${missingRequired.length} required skill(s): ${missingRequired.map(g => g.skill).join(', ')}`)
        }
        if (overallFitPercentage >= 80) {
            recommendations.push('Strong fit — proceed to interview')
        } else if (overallFitPercentage >= 60) {
            recommendations.push('Moderate fit — consider a skills assessment to validate gaps')
        } else {
            recommendations.push('Significant gaps — may need additional training or mentorship')
        }

        const summary = `Candidate matches ${overallFitPercentage}% of required skills for ${(job as any).title}. ${missingRequired.length} required skill(s) not found.`

        return {
            candidateId, jobId, gaps, overallFitPercentage,
            summary, recommendations, isAIGenerated: false,
        }
    }

    async generateFitExplanation(candidateId: string, jobId: string, orgId: string): Promise<{ explanation: string; isAIGenerated: boolean }> {
        const gapAnalysis = await this.analyzeSkillGaps(candidateId, jobId, orgId)

        const client = this.getClient()
        if (!client) {
            return { explanation: gapAnalysis.summary, isAIGenerated: false }
        }

        try {
            const resp = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.2,
                max_tokens: 200,
                messages: [
                    { role: 'system', content: 'Write a 2-3 sentence recruiter-facing explanation of candidate fit. Be specific and factual. No fluff.' },
                    { role: 'user', content: JSON.stringify({ fitPercentage: gapAnalysis.overallFitPercentage, gaps: gapAnalysis.gaps.slice(0, 8), recommendations: gapAnalysis.recommendations }) },
                ],
            })
            return { explanation: resp.choices[0]?.message?.content?.trim() || gapAnalysis.summary, isAIGenerated: true }
        } catch {
            return { explanation: gapAnalysis.summary, isAIGenerated: false }
        }
    }
}

export const aiResumeAnalysisService = new AIResumeAnalysisService()
