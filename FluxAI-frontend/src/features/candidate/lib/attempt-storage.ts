/**
 * Session storage keys for candidate assessment flow (attemptId and round order).
 * Used so system-check, identity-check, and round pages can access attempt without putting it in URL.
 */

const PREFIX = 'fluxai_attempt_'

export function getAttemptId(assessmentId: string): string | null {
    if (typeof window === 'undefined') return null
    return sessionStorage.getItem(`${PREFIX}id_${assessmentId}`)
}

export function setAttemptId(assessmentId: string, attemptId: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(`${PREFIX}id_${assessmentId}`, attemptId)
}

export function getRoundTypes(assessmentId: string): string[] | null {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem(`${PREFIX}rounds_${assessmentId}`)
    if (!raw) return null
    try {
        return JSON.parse(raw) as string[]
    } catch {
        return null
    }
}

export function setRoundTypes(assessmentId: string, roundTypes: string[]): void {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(`${PREFIX}rounds_${assessmentId}`, JSON.stringify(roundTypes))
}

export function clearAttempt(assessmentId: string): void {
    if (typeof window === 'undefined') return
    sessionStorage.removeItem(`${PREFIX}id_${assessmentId}`)
    sessionStorage.removeItem(`${PREFIX}rounds_${assessmentId}`)
}
