/**
 * Types for Judge0 CE API (https://ce.judge0.com).
 * Used for DSA round code execution and evaluation.
 */

export interface Judge0SubmissionRequest {
    source_code: string
    language_id: number
    stdin?: string
    expected_output?: string
    cpu_time_limit?: number
    memory_limit?: number
}

export interface Judge0Status {
    id: number
    description: string
}

export interface Judge0SubmissionResponse {
    token?: string
    stdout: string | null
    stderr: string | null
    compile_output: string | null
    message: string | null
    status: Judge0Status
    time: string | null
    memory: number | null
    exit_code: number | null
    exit_signal: number | null
}

/** Result normalized for our evaluation logic. */
export interface Judge0RunResult {
    accepted: boolean
    stdout: string
    stderr: string
    statusId: number
    statusDescription: string
    timeSeconds: number | null
    memoryKb: number | null
    compileError: string | null
}
