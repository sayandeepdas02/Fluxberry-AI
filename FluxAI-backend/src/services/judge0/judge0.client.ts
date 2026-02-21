/**
 * Judge0 CE client for sandboxed code execution.
 * Used by DSA "Run Code" (live) and DSA evaluation (test cases).
 * Supports sync (wait=true) and async (wait=false + poll) so it works with any Judge0 host.
 * @see https://ce.judge0.com
 */

import type { Judge0SubmissionRequest, Judge0SubmissionResponse, Judge0RunResult } from './judge0.types.js'

const JUDGE0_ACCEPTED_STATUS_ID = 3
/** Status 1 = In Queue, 2 = Processing. We poll until status.id > 2. */
const JUDGE0_PENDING_STATUS_IDS = [1, 2]
const POLL_INTERVAL_MS = 800
const POLL_TIMEOUT_MS = 60_000

/** Map our language identifier (lowercase) to Judge0 CE language_id. */
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
    python: 71,
    python3: 71,
    javascript: 63,
    node: 63,
    java: 62,
    cpp: 54,
    'c++': 54,
    c: 50,
    csharp: 51,
    'c#': 51,
    go: 60,
    ruby: 72,
    php: 68,
    rust: 73,
    kotlin: 78,
    swift: 83,
}

export function getJudge0LanguageId(language: string): number | null {
    const key = language.toLowerCase().trim()
    return JUDGE0_LANGUAGE_IDS[key] ?? null
}

function normalizeOutput(s: string | null | undefined): string {
    if (s == null) return ''
    return String(s).trimEnd()
}

export type Judge0ClientOptions = {
    authToken?: string
    rapidApiKey?: string
    rapidApiHost?: string
    /** CPU time limit in seconds (per run). Default 2. */
    cpuTimeLimit?: number
    /** Memory limit in KB (per run). Default 128000 (128 MB). */
    memoryLimitKb?: number
}

function buildHeaders(options?: Judge0ClientOptions): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (options?.rapidApiKey) {
        headers['X-RapidAPI-Key'] = options.rapidApiKey
        if (options.rapidApiHost) headers['X-RapidAPI-Host'] = options.rapidApiHost
    } else if (options?.authToken) {
        headers['X-Auth-Token'] = options.authToken
    }
    return headers
}

/**
 * Verify authentication token (Judge0 CE API: POST /authenticate).
 * @see https://ce.judge0.com/ — Authentication → Authenticate
 * Returns true if token is valid or auth is disabled; false on 401.
 */
export async function authenticate(
    baseUrl: string,
    options?: Judge0ClientOptions
): Promise<boolean> {
    const url = new URL('/authenticate', baseUrl)
    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: buildHeaders(options),
    })
    if (res.status === 401) return false
    if (!res.ok) throw new Error(`Judge0 authenticate failed: ${res.status} ${await res.text()}`)
    return true
}

function responseToResult(data: Judge0SubmissionResponse, request: Judge0SubmissionRequest): Judge0RunResult {
    const statusId = data.status?.id ?? 0
    const accepted = statusId === JUDGE0_ACCEPTED_STATUS_ID
    const stdout = normalizeOutput(data.stdout)
    const expected = request.expected_output != null ? normalizeOutput(request.expected_output) : null
    const outputMatch = expected == null || stdout === expected

    return {
        accepted: accepted && outputMatch,
        stdout,
        stderr: normalizeOutput(data.stderr) || '',
        statusId,
        statusDescription: data.status?.description ?? 'Unknown',
        timeSeconds: data.time != null ? parseFloat(String(data.time)) : null,
        memoryKb: data.memory ?? null,
        compileError: data.compile_output ? normalizeOutput(data.compile_output) : null,
        exitCode: data.exit_code ?? null,
    }
}

/**
 * Fetch a submission by token (for async polling).
 */
export async function getSubmission(
    baseUrl: string,
    token: string,
    options?: Judge0ClientOptions
): Promise<Judge0SubmissionResponse> {
    const url = new URL(`/submissions/${token}`, baseUrl)
    url.searchParams.set('base64_encoded', 'false')

    const res = await fetch(url.toString(), {
        method: 'GET',
        headers: buildHeaders(options),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Judge0 get submission failed: ${res.status} ${text}`)
    }

    return (await res.json()) as Judge0SubmissionResponse
}

/**
 * Create submission with wait=false, then poll until done.
 */
async function runSubmissionAsync(
    baseUrl: string,
    request: Judge0SubmissionRequest,
    options?: Judge0ClientOptions
): Promise<Judge0RunResult> {
    const url = new URL('/submissions', baseUrl)
    url.searchParams.set('base64_encoded', 'false')
    url.searchParams.set('wait', 'false')

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: buildHeaders(options),
        body: JSON.stringify({
            source_code: request.source_code,
            language_id: request.language_id,
            stdin: request.stdin ?? undefined,
            expected_output: request.expected_output ?? undefined,
            cpu_time_limit: request.cpu_time_limit ?? 2,
            memory_limit: request.memory_limit ?? 128000,
        }),
    })

    if (!res.ok) {
        const text = await res.text()
        throw new Error(`Judge0 submit failed: ${res.status} ${text}`)
    }

    const createData = (await res.json()) as { token?: string; error?: string }
    const token = createData.token
    if (!token) {
        throw new Error(createData.error ?? 'Judge0 did not return a submission token')
    }

    const start = Date.now()
    while (Date.now() - start < POLL_TIMEOUT_MS) {
        const data = await getSubmission(baseUrl, token, options)
        const statusId = data.status?.id ?? 0
        if (!JUDGE0_PENDING_STATUS_IDS.includes(statusId)) {
            return responseToResult(data, request)
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }

    throw new Error('Judge0 execution timed out while waiting for result')
}

/**
 * Submit code and wait for result. Tries sync (wait=true) first; if the host
 * returns 400 "wait not allowed", falls back to async (submit + poll).
 */
export async function runSubmission(
    baseUrl: string,
    request: Judge0SubmissionRequest,
    options?: Judge0ClientOptions & { wait?: boolean }
): Promise<Judge0RunResult> {
    const wait = options?.wait !== false
    const url = new URL('/submissions', baseUrl)
    url.searchParams.set('base64_encoded', 'false')
    url.searchParams.set('wait', String(wait))

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: buildHeaders(options),
        body: JSON.stringify({
            source_code: request.source_code,
            language_id: request.language_id,
            stdin: request.stdin ?? undefined,
            expected_output: request.expected_output ?? undefined,
            cpu_time_limit: request.cpu_time_limit ?? 2,
            memory_limit: request.memory_limit ?? 128000,
        }),
    })

    const text = await res.text()

    if (res.ok) {
        const data = JSON.parse(text) as Judge0SubmissionResponse & { status?: { id?: number } }
        const statusId = data.status?.id
        if (statusId != null && !JUDGE0_PENDING_STATUS_IDS.includes(statusId)) {
            return responseToResult(data as Judge0SubmissionResponse, request)
        }
        if (data.token != null) {
            return runSubmissionAsync(baseUrl, request, options)
        }
        return responseToResult(data as Judge0SubmissionResponse, request)
    }

    let errMsg = text
    try {
        if (text) {
            const errBody = JSON.parse(text) as { error?: string }
            if (errBody.error) errMsg = errBody.error
        }
    } catch {
        /* use text as-is */
    }
    if (res.status === 400 && typeof errMsg === 'string' && errMsg.toLowerCase().includes('wait')) {
        return runSubmissionAsync(baseUrl, request, options)
    }

    throw new Error(`Judge0 request failed: ${res.status} ${errMsg}`)
}

/**
 * Run code against a single test case and return whether output matches.
 */
export async function runTestCase(
    baseUrl: string,
    sourceCode: string,
    languageId: number,
    stdin: string,
    expectedStdout: string,
    options?: Judge0ClientOptions
): Promise<{ passed: boolean; result: Judge0RunResult }> {
    const result = await runSubmission(
        baseUrl,
        {
            source_code: sourceCode,
            language_id: languageId,
            stdin,
            expected_output: expectedStdout,
            cpu_time_limit: options?.cpuTimeLimit ?? 2,
            memory_limit: options?.memoryLimitKb ?? 128000,
        },
        { ...options, wait: true }
    )
    return { passed: result.accepted, result }
}

/**
 * Run code with optional stdin (no test-case comparison). For "Run Code" in DSA UI.
 */
export async function runCode(
    baseUrl: string,
    sourceCode: string,
    languageId: number,
    stdin: string,
    options?: Judge0ClientOptions
): Promise<Judge0RunResult> {
    return runSubmission(
        baseUrl,
        {
            source_code: sourceCode,
            language_id: languageId,
            stdin: stdin || undefined,
            cpu_time_limit: options?.cpuTimeLimit ?? 2,
            memory_limit: options?.memoryLimitKb ?? 128000,
        },
        { ...options, wait: true }
    )
}
