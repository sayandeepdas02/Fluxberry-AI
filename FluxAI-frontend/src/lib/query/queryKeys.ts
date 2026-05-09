/**
 * Central query key registry. All useQuery/useInfiniteQuery/invalidateQueries calls
 * should reference these factories so invalidation is type-safe and never diverges.
 *
 * Convention: each domain has an `all` sentinel so you can invalidate the whole
 * namespace with { queryKey: fooKeys.all }.
 */

// ── Auth ──────────────────────────────────────────────────────
export const authKeys = {
    all: ['auth'] as const,
    me: () => [...authKeys.all, 'me'] as const,
}

// ── Organization ─────────────────────────────────────────────
export const orgKeys = {
    all: ['organization'] as const,
    settings: () => [...orgKeys.all, 'settings'] as const,
    career: () => [...orgKeys.all, 'career'] as const,
    members: () => [...orgKeys.all, 'members'] as const,
}

// ── Jobs ─────────────────────────────────────────────────────
export const jobKeys = {
    all: ['jobs'] as const,
    list: (params?: object) => [...jobKeys.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...jobKeys.all, 'detail', id] as const,
    active: () => [...jobKeys.all, 'active'] as const,
    careerPage: () => [...jobKeys.all, 'career-page'] as const,
    distribution: () => [...jobKeys.all, 'published-distribution'] as const,
    insights: () => [...jobKeys.all, 'all-insights'] as const,
}

// ── Candidates ───────────────────────────────────────────────
export const candidateKeys = {
    all: ['candidates'] as const,
    list: (params?: object) => [...candidateKeys.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...candidateKeys.all, 'detail', id] as const,
    referrals: () => [...candidateKeys.all, 'referrals'] as const,
    activity: (id: string) => [...candidateKeys.all, 'activity', id] as const,
}

// ── Applications ─────────────────────────────────────────────
export const applicationKeys = {
    all: ['applications'] as const,
    byJob: (jobId: string) => [...applicationKeys.all, 'job', jobId] as const,
    detail: (id: string) => [...applicationKeys.all, 'detail', id] as const,
}

// ── ATS Screening ────────────────────────────────────────────
export const atsKeys = {
    all: ['ats'] as const,
    candidates: (params?: object) => [...atsKeys.all, 'candidates', params ?? {}] as const,
    pipeline: (jobId: string) => [...atsKeys.all, 'pipeline', jobId] as const,
    stages: (jobId: string) => [...atsKeys.all, 'stages', jobId] as const,
}

// ── Dashboard ────────────────────────────────────────────────
export const dashboardKeys = {
    all: ['dashboard'] as const,
    summary: () => [...dashboardKeys.all, 'summary'] as const,
    analytics: () => [...dashboardKeys.all, 'analytics'] as const,
}

// ── Analytics ────────────────────────────────────────────────
export const analyticsKeys = {
    all: ['analytics'] as const,
    kpis: (filter?: string) => [...analyticsKeys.all, 'kpis', filter ?? 'all'] as const,
    trends: (filter?: string) => [...analyticsKeys.all, 'trends', filter ?? 'all'] as const,
    demographics: () => [...analyticsKeys.all, 'demographics'] as const,
    funnel: (filter?: string) => [...analyticsKeys.all, 'funnel', filter ?? 'all'] as const,
    tth: (filter?: string) => [...analyticsKeys.all, 'tth', filter ?? 'all'] as const,
    efficiency: (filter?: string) => [...analyticsKeys.all, 'efficiency', filter ?? 'all'] as const,
}

// ── Assessments ──────────────────────────────────────────────
export const assessmentKeys = {
    all: ['assessments'] as const,
    list: () => [...assessmentKeys.all, 'list'] as const,
    results: (id: string) => [...assessmentKeys.all, 'results', id] as const,
    aiSessions: (assessmentId: string, attemptIds: string[]) =>
        [...assessmentKeys.all, 'ai-sessions', assessmentId, attemptIds] as const,
}

// ── Questions ────────────────────────────────────────────────
export const questionKeys = {
    all: ['questions'] as const,
    list: (params?: object) => [...questionKeys.all, 'list', params ?? {}] as const,
}

// ── Interviews ───────────────────────────────────────────────
export const interviewKeys = {
    all: ['interviews'] as const,
    list: (status?: string) => [...interviewKeys.all, 'list', status ?? 'all'] as const,
}

// ── Prospects ────────────────────────────────────────────────
export const prospectKeys = {
    all: ['prospects'] as const,
    list: (params?: object) => [...prospectKeys.all, 'list', params ?? {}] as const,
    detail: (id: string) => [...prospectKeys.all, 'detail', id] as const,
    fit: (id: string) => [...prospectKeys.all, 'fit', id] as const,
    lists: () => [...prospectKeys.all, 'lists'] as const,
    listDetail: (id: string) => [...prospectKeys.all, 'lists', id] as const,
}

// ── Email Templates ──────────────────────────────────────────
export const emailTemplateKeys = {
    all: ['email-templates'] as const,
    list: () => [...emailTemplateKeys.all, 'list'] as const,
    detail: (id: string) => [...emailTemplateKeys.all, 'detail', id] as const,
}

// ── Campaigns ────────────────────────────────────────────────
export const campaignKeys = {
    all: ['campaigns'] as const,
    list: () => [...campaignKeys.all, 'list'] as const,
    analytics: () => [...campaignKeys.all, 'analytics'] as const,
}

// ── Scorecards ───────────────────────────────────────────────
export const scorecardKeys = {
    all: ['scorecards'] as const,
    list: () => [...scorecardKeys.all, 'list'] as const,
    detail: (id: string) => [...scorecardKeys.all, 'detail', id] as const,
}

// ── Workflows ────────────────────────────────────────────────
export const workflowKeys = {
    all: ['workflows'] as const,
    list: () => [...workflowKeys.all, 'list'] as const,
}

// ── Activity ─────────────────────────────────────────────────
export const activityKeys = {
    all: ['activity'] as const,
    inbox: (filter?: string, page?: number) => [...activityKeys.all, 'inbox', filter ?? 'all', page ?? 1] as const,
}

// ── Onboarding ───────────────────────────────────────────────
export const onboardingKeys = {
    all: ['onboarding'] as const,
    signatures: () => [...onboardingKeys.all, 'signatures'] as const,
}

// ── Marketplace ──────────────────────────────────────────────
export const marketplaceKeys = {
    all: ['marketplace'] as const,
    apps: () => [...marketplaceKeys.all, 'apps'] as const,
}
