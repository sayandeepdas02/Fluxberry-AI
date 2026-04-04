/**
 * LLM Service — AI Screening Engine
 *
 * Wraps OpenAI chat completions with:
 * - JSON-only output mode (response_format: json_object)
 * - Zod schema validation of parsed response
 * - One automatic retry on invalid JSON or schema failure
 * - 6-second hard timeout via AbortController
 * - Token + latency logging per call
 */

import OpenAI from 'openai'
import { z } from 'zod'

// ─── Typed error ──────────────────────────────────────────────────────────────

export type LLMErrorCode = 'LLM_TIMEOUT' | 'LLM_INVALID_JSON' | 'LLM_SCHEMA_ERROR' | 'LLM_API_ERROR'

export class LLMError extends Error {
    constructor(
        message: string,
        public readonly code: LLMErrorCode,
        public readonly cause?: unknown
    ) {
        super(message)
        this.name = 'LLMError'
    }
}

// ─── Input / Output types ─────────────────────────────────────────────────────

export interface LLMCallInput<TSchema extends z.ZodTypeAny> {
    systemPrompt: string
    userMessage: string
    schema: TSchema
    temperature?: number
    model?: string
}

export interface LLMCallResult<T> {
    data: T
    latencyMs: number
    promptTokens: number
    completionTokens: number
    model: string
}

// ─── LLM Service ─────────────────────────────────────────────────────────────

const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const TIMEOUT_MS = 6_000

class LLMService {
    private client: OpenAI

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'dummy-key-to-allow-startup',
        })
    }

    /**
     * Call the LLM with a structured JSON-mode prompt.
     * Validates the response against the provided Zod schema.
     * Retries once on JSON parse or schema validation failure.
     */
    async call<TSchema extends z.ZodTypeAny>(
        input: LLMCallInput<TSchema>
    ): Promise<LLMCallResult<z.infer<TSchema>>> {
        const startTime = Date.now()
        let lastError: unknown

        for (let attempt = 0; attempt <= 1; attempt++) {
            try {
                const result = await this.callOnce(input)
                const latencyMs = Date.now() - startTime

                this.logCall({
                    model: result.model,
                    latencyMs,
                    promptTokens: result.promptTokens,
                    completionTokens: result.completionTokens,
                    attempt,
                })

                return {
                    data: result.data,
                    latencyMs,
                    promptTokens: result.promptTokens,
                    completionTokens: result.completionTokens,
                    model: result.model,
                }
            } catch (err) {
                lastError = err
                // Only retry on parse/schema errors — not on timeout or API errors
                if (err instanceof LLMError && (err.code === 'LLM_INVALID_JSON' || err.code === 'LLM_SCHEMA_ERROR')) {
                    console.warn(`[LLMService] Attempt ${attempt + 1} failed (${err.code}), ${attempt === 0 ? 'retrying...' : 'giving up'}`)
                    continue
                }
                throw err
            }
        }

        throw lastError
    }

    private async callOnce<TSchema extends z.ZodTypeAny>(
        input: LLMCallInput<TSchema>
    ): Promise<{ data: z.infer<TSchema>; model: string; promptTokens: number; completionTokens: number }> {
        const { systemPrompt, userMessage, schema, temperature = 0.3, model = DEFAULT_MODEL } = input

        // 6-second hard timeout
        const controller = new AbortController()
        const timeoutHandle = setTimeout(() => controller.abort(), TIMEOUT_MS)

        let rawContent: string
        let usedModel: string
        let promptTokens = 0
        let completionTokens = 0

        try {
            const response = await this.client.chat.completions.create(
                {
                    model,
                    temperature,
                    response_format: { type: 'json_object' },
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage },
                    ],
                },
                { signal: controller.signal }
            )

            rawContent = response.choices[0]?.message?.content ?? ''
            usedModel = response.model
            promptTokens = response.usage?.prompt_tokens ?? 0
            completionTokens = response.usage?.completion_tokens ?? 0
        } catch (err: unknown) {
            if (err instanceof Error && err.name === 'AbortError') {
                throw new LLMError(`LLM call timed out after ${TIMEOUT_MS}ms`, 'LLM_TIMEOUT', err)
            }
            throw new LLMError(
                `OpenAI API error: ${err instanceof Error ? err.message : String(err)}`,
                'LLM_API_ERROR',
                err
            )
        } finally {
            clearTimeout(timeoutHandle)
        }

        // Parse JSON
        let parsed: unknown
        try {
            parsed = JSON.parse(rawContent)
        } catch (err) {
            throw new LLMError(
                `Failed to parse LLM JSON response: ${rawContent.slice(0, 200)}`,
                'LLM_INVALID_JSON',
                err
            )
        }

        // Validate schema
        const validation = schema.safeParse(parsed)
        if (!validation.success) {
            throw new LLMError(
                `LLM response failed schema validation: ${JSON.stringify(validation.error.errors)}`,
                'LLM_SCHEMA_ERROR',
                validation.error
            )
        }

        return {
            data: validation.data,
            model: usedModel,
            promptTokens,
            completionTokens,
        }
    }

    private logCall(info: {
        model: string
        latencyMs: number
        promptTokens: number
        completionTokens: number
        attempt: number
    }) {
        console.log(
            `[LLMService] model=${info.model} latency=${info.latencyMs}ms ` +
            `tokens=[prompt:${info.promptTokens} completion:${info.completionTokens}]` +
            (info.attempt > 0 ? ` (retry #${info.attempt})` : '')
        )
    }
}

export const llmService = new LLMService()
