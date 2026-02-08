/**
 * Judge0 CE client for sandboxed code execution.
 * Used by DSA evaluation to run candidate code against test cases.
 * @see https://ce.judge0.com
 */

import type { Judge0SubmissionRequest, Judge0SubmissionResponse, Judge0RunResult } from './judge0.types.js'

const JUDGE0_ACCEPTED_STATUS_ID = 3

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

/**
 * Submit code to Judge0 and wait for result (synchronous).
 * Uses wait=true; if the Judge0 instance does not allow wait, this will fail.
 * Supports Judge0 CE auth (X-Auth-Token) or RapidAPI (X-RapidAPI-Key + X-RapidAPI-Host).
 */
export async function runSubmission(
    baseUrl: string,
    request: Judge0SubmissionRequest,
    options?: { authToken?: string; rapidApiKey?: string; rapidApiHost?: string; wait?: boolean }
): Promise<Judge0RunResult> {
    const wait = options?.wait !== false
    const url = new URL('/submissions', baseUrl)
    url.searchParams.set('base64_encoded', 'false')
    url.searchParams.set('wait', String(wait))

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }
    if (options?.rapidApiKey) {
        headers['X-RapidAPI-Key'] = options.rapidApiKey
        if (options.rapidApiHost) {
            headers['X-RapidAPI-Host'] = options.rapidApiHost
        }
    } else if (options?.authToken) {
        headers['X-Auth-Token'] = options.authToken
    }

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers,
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
        throw new Error(`Judge0 request failed: ${res.status} ${text}`)
    }

    const data = (await res.json()) as Judge0SubmissionResponse

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
        timeSeconds: data.time != null ? parseFloat(data.time) : null,
        memoryKb: data.memory ?? null,
        compileError: data.compile_output ? normalizeOutput(data.compile_output) : null,
    }
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
    options?: { authToken?: string; rapidApiKey?: string; rapidApiHost?: string }
): Promise<{ passed: boolean; result: Judge0RunResult }> {
    const result = await runSubmission(
        baseUrl,
        {
            source_code: sourceCode,
            language_id: languageId,
            stdin,
            expected_output: expectedStdout,
        },
        { ...options, wait: true }
    )
    return { passed: result.accepted, result }
}

/**
 * Run code with optional stdin (no test-case comparison). For "Run Code" in UI.
 */
export async function runCode(
    baseUrl: string,
    sourceCode: string,
    languageId: number,
    stdin: string,
    options?: { authToken?: string; rapidApiKey?: string; rapidApiHost?: string }
): Promise<Judge0RunResult> {
    return runSubmission(
        baseUrl,
        {
            source_code: sourceCode,
            language_id: languageId,
            stdin: stdin || undefined,
        },
        { ...options, wait: true }
    )
}
