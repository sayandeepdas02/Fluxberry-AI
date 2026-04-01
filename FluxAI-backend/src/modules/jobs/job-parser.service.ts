/**
 * Job Parser Service
 *
 * Uses OpenAI to extract structured data from a free-text job description.
 * Extraction only — no scoring decisions are made by the LLM.
 * All output is post-processed through deterministic normalizers.
 */

import OpenAI from 'openai'
import { normalizeSkill } from '../ats-screening/scoring-v2/skill-normalizer.js'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Unknown'

export interface ParsedJobData {
    requiredSkills:  string[]
    optionalSkills:  string[]
    roleType:        string
    seniorityLevel:  SeniorityLevel
    experienceRange: { min: number; max: number }
    educationLevel?: string
    /** Suggested scoring weights derived from role type (0–1, sum=1) */
    suggestedWeights?: {
        skills:      number
        experience:  number
        projects:    number
        education:   number
        signalBoost: number
    }
}

// ──────────────────────────────────────────────────────────────
// Role-based weight presets
// ──────────────────────────────────────────────────────────────

const ROLE_WEIGHT_PRESETS: Record<string, ParsedJobData['suggestedWeights']> = {
    Frontend: {
        skills: 0.40, experience: 0.25, projects: 0.20, education: 0.10, signalBoost: 0.05,
    },
    Backend: {
        skills: 0.35, experience: 0.30, projects: 0.20, education: 0.10, signalBoost: 0.05,
    },
    Fullstack: {
        skills: 0.35, experience: 0.25, projects: 0.25, education: 0.10, signalBoost: 0.05,
    },
    'Data Science': {
        skills: 0.35, experience: 0.25, projects: 0.25, education: 0.10, signalBoost: 0.05,
    },
    'Machine Learning': {
        skills: 0.30, experience: 0.25, projects: 0.25, education: 0.15, signalBoost: 0.05,
    },
    DevOps: {
        skills: 0.35, experience: 0.30, projects: 0.20, education: 0.10, signalBoost: 0.05,
    },
    Design: {
        skills: 0.30, experience: 0.20, projects: 0.35, education: 0.10, signalBoost: 0.05,
    },
    Management: {
        skills: 0.20, experience: 0.40, projects: 0.20, education: 0.15, signalBoost: 0.05,
    },
    default: {
        skills: 0.35, experience: 0.25, projects: 0.20, education: 0.15, signalBoost: 0.05,
    },
}

function getRoleWeights(roleType: string): ParsedJobData['suggestedWeights'] {
    const key = Object.keys(ROLE_WEIGHT_PRESETS).find(
        k => k.toLowerCase() === roleType?.toLowerCase()
    )
    return ROLE_WEIGHT_PRESETS[key ?? 'default']
}

// ──────────────────────────────────────────────────────────────
// OpenAI system prompt
// ──────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precision job description parser for an ATS system.
Extract structured information from job descriptions. Return ONLY valid JSON matching this schema:

{
  "requiredSkills": string[],     // Hard requirements — must have
  "optionalSkills": string[],     // Nice-to-have / preferred
  "roleType": string,             // e.g. "Frontend", "Backend", "Fullstack", "Data Science", "DevOps", "Design", "Management"
  "seniorityLevel": "Junior" | "Mid" | "Senior" | "Lead" | "Unknown",
  "experienceRange": { "min": number, "max": number },   // years
  "educationLevel": string | null   // e.g. "Bachelor's", "Master's", null
}

Rules:
- Extract ONLY what is explicitly stated in the JD
- Do NOT invent skills or requirements that are not mentioned
- Skills must be individual technologies/tools/concepts, not sentences
- If experience is not mentioned, use { "min": 0, "max": 5 }
- Separate "required" (must-have) from "optional" (nice-to-have) carefully
- Respond with ONLY the JSON object, no markdown, no explanation`

// ──────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────

const DEFAULT_FALLBACK: ParsedJobData = {
    requiredSkills: [],
    optionalSkills: [],
    roleType: 'Unknown',
    seniorityLevel: 'Unknown',
    experienceRange: { min: 0, max: 5 },
    educationLevel: undefined,
}

class JobParserService {
    private client: OpenAI | null = null

    private getClient(): OpenAI {
        if (!this.client) {
            const apiKey = process.env.OPENAI_API_KEY
            if (!apiKey || apiKey.includes('dummy')) {
                throw new Error('OPENAI_API_KEY is not configured. Set a valid key to use AI parsing.')
            }
            this.client = new OpenAI({ apiKey })
        }
        return this.client
    }

    /**
     * Parse a raw job description and extract structured fields.
     * Post-processes skills through the canonical normalizer.
     */
    async parseJobDescription(description: string): Promise<ParsedJobData> {
        let raw: any

        try {
            const client = this.getClient()

            const completion = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0,             // Deterministic extraction
                max_tokens: 800,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: description.slice(0, 4000) }, // Hard cap
                ],
            })

            const content = completion.choices[0]?.message?.content ?? '{}'
            raw = JSON.parse(content)
        } catch (err: any) {
            // If OpenAI fails (quota, bad key, etc.) — return empty fallback
            // so the UI still works with manual input
            console.warn('[JobParser] OpenAI parse failed, returning fallback:', err.message)
            return DEFAULT_FALLBACK
        }

        return this.postProcess(raw)
    }

    private postProcess(raw: any): ParsedJobData {
        // Normalize skills through canonical normalizer (same as ATS engine)
        const normalizeList = (arr: unknown): string[] => {
            if (!Array.isArray(arr)) return []
            return [...new Set(
                arr
                    .filter((s): s is string => typeof s === 'string' && s.length > 0)
                    .map(s => normalizeSkill(s))
                    .filter(Boolean)
            )]
        }

        const requiredSkills = normalizeList(raw.requiredSkills)
        const optionalSkills  = normalizeList(raw.optionalSkills)
            .filter(s => !requiredSkills.includes(s)) // no overlap

        const roleType = typeof raw.roleType === 'string' ? raw.roleType.trim() : 'Unknown'

        const seniority: SeniorityLevel = ['Junior', 'Mid', 'Senior', 'Lead'].includes(raw.seniorityLevel)
            ? raw.seniorityLevel
            : 'Unknown'

        const expMin = typeof raw.experienceRange?.min === 'number' ? Math.max(0, raw.experienceRange.min) : 0
        const expMax = typeof raw.experienceRange?.max === 'number' ? Math.max(expMin, raw.experienceRange.max) : Math.max(expMin, 5)

        const educationLevel = typeof raw.educationLevel === 'string' && raw.educationLevel
            ? raw.educationLevel
            : undefined

        return {
            requiredSkills,
            optionalSkills,
            roleType,
            seniorityLevel: seniority,
            experienceRange: { min: expMin, max: expMax },
            educationLevel,
            suggestedWeights: getRoleWeights(roleType),
        }
    }
}

export const jobParserService = new JobParserService()
