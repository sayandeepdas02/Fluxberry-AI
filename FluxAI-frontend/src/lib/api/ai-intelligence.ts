import { apiClient } from './client'

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
    fitLabel?: 'strong' | 'good' | 'potential' | 'weak'
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

export const aiApi = {
    getCandidateInsights: (candidateId: string, jobId?: string) =>
        apiClient.get<CandidateInsights>(`/ai/candidates/${candidateId}/insights`, jobId ? { jobId } : undefined),

    generateOutreachDraft: (candidateId: string, jobId: string) =>
        apiClient.post<OutreachDraft>(`/ai/candidates/${candidateId}/outreach-draft`, { jobId }),

    getSkillGap: (candidateId: string, jobId: string) =>
        apiClient.get<SkillGapAnalysis>(`/ai/candidates/${candidateId}/skill-gap`, { jobId }),

    getRankedCandidates: (jobId: string, limit = 20) =>
        apiClient.get<RankedCandidate[]>(`/ai/jobs/${jobId}/ranked-candidates`, { limit }),

    getPipelineOptimizations: (jobId: string) =>
        apiClient.get<PipelineOptimization>(`/ai/jobs/${jobId}/pipeline-optimizations`),

    detectBottlenecks: () =>
        apiClient.get<HiringBottleneck[]>('/ai/hiring-bottlenecks'),

    copilotChat: (messages: { role: 'user' | 'assistant'; content: string }[], context?: { jobId?: string; candidateId?: string }) =>
        apiClient.post<{ response: string }>('/ai/copilot/chat', { messages, context }),
}
