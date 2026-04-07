/**
 * Resume Extraction Service
 *
 * Takes raw plaintext from a parsed resume and uses GPT to extract
 * structured fields (skills, experience, education, projects).
 *
 * This bridges the gap between raw text extraction (resume-parsing.service)
 * and the structured `IResumeParsedData` shape required by the scoring engine.
 *
 * Design:
 *   - Falls back gracefully if OpenAI is unavailable — returns empty arrays
 *   - Uses the same GPT pattern as job-parser.service.ts
 *   - Post-processes skills through the canonical skill normalizer
 */

import OpenAI from 'openai'
import { normalizeSkill } from '../modules/ats-screening/scoring-v2/skill-normalizer.js'
import type { IResumeParsedData } from '../modules/ats-screening/models/resume-profile.model.js'

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

/** Maximum characters of resume text sent to GPT (controls token cost) */
const MAX_INPUT_CHARS = 6000

const SYSTEM_PROMPT = `You are a precision resume parser for an ATS system.
Extract structured information from resume text. Return ONLY valid JSON matching this schema:

{
  "skills": string[],
  "experience": [
    {
      "title": string,
      "company": string,
      "durationMonths": number,
      "startDate": string | null,
      "endDate": string | null,
      "description": string
    }
  ],
  "education": [
    {
      "degree": string,
      "institution": string,
      "level": string
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string
    }
  ]
}

Rules:
- Extract ONLY what is explicitly stated in the resume
- Do NOT invent or infer skills, roles, or education not mentioned
- "skills" must be individual technologies, tools, frameworks, languages, or concepts — NOT sentences
- "durationMonths" should be estimated from dates if given; use 0 if unknown
- "level" for education should be: "High School", "Associate", "Bachelor", "Master", "PhD", or "Other"
- If a section is not found, return an empty array for that field
- Respond with ONLY the JSON object, no markdown, no explanation`

// ──────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────

class ResumeExtractionService {
    private client: OpenAI | null = null

    private getClient(): OpenAI | null {
        if (this.client) return this.client

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey || apiKey.includes('dummy') || apiKey === 'sk-placeholder') {
            return null
        }

        this.client = new OpenAI({ apiKey })
        return this.client
    }

    /**
     * Extract structured resume data from raw plaintext.
     *
     * If OpenAI is not configured or the call fails, returns a minimal
     * object with rawText populated but empty structured arrays.
     */
    async extract(rawText: string): Promise<IResumeParsedData> {
        const fallback: IResumeParsedData = {
            rawText,
            skills: [],
            experience: [],
            education: [],
            projects: [],
        }

        const client = this.getClient()
        if (!client) {
            console.warn('[ResumeExtraction] OpenAI not configured — returning raw text only')
            return fallback
        }

        if (!rawText || rawText.length < 20) {
            console.warn(`[ResumeExtraction] Text too short for extraction (${rawText.length} chars)`)
            return fallback
        }

        try {
            const completion = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0,
                max_tokens: 1500,
                response_format: { type: 'json_object' },
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: rawText.slice(0, MAX_INPUT_CHARS) },
                ],
            })

            const content = completion.choices[0]?.message?.content ?? '{}'
            const raw = JSON.parse(content)

            return this.postProcess(raw, rawText)
        } catch (err: any) {
            console.warn('[ResumeExtraction] GPT extraction failed, returning raw text only:', err.message)
            return fallback
        }
    }

    private postProcess(raw: any, rawText: string): IResumeParsedData {
        // Normalize skills through canonical normalizer
        const skills = this.normalizeSkillList(raw.skills)

        // Sanitize experience entries
        const experience = Array.isArray(raw.experience)
            ? raw.experience
                .filter((e: any) => e && typeof e === 'object')
                .map((e: any) => ({
                    title: typeof e.title === 'string' ? e.title.trim() : undefined,
                    company: typeof e.company === 'string' ? e.company.trim() : undefined,
                    durationMonths: typeof e.durationMonths === 'number' ? Math.max(0, Math.round(e.durationMonths)) : undefined,
                    startDate: typeof e.startDate === 'string' ? e.startDate : undefined,
                    endDate: typeof e.endDate === 'string' ? e.endDate : undefined,
                    description: typeof e.description === 'string' ? e.description.trim() : undefined,
                }))
            : []

        // Sanitize education entries
        const education = Array.isArray(raw.education)
            ? raw.education
                .filter((e: any) => e && typeof e === 'object')
                .map((e: any) => ({
                    degree: typeof e.degree === 'string' ? e.degree.trim() : undefined,
                    institution: typeof e.institution === 'string' ? e.institution.trim() : undefined,
                    level: typeof e.level === 'string' ? e.level.trim() : undefined,
                }))
            : []

        // Sanitize project entries
        const projects = Array.isArray(raw.projects)
            ? raw.projects
                .filter((p: any) => p && typeof p === 'object')
                .map((p: any) => ({
                    name: typeof p.name === 'string' ? p.name.trim() : undefined,
                    description: typeof p.description === 'string' ? p.description.trim() : undefined,
                }))
            : []

        return {
            rawText,
            skills,
            experience,
            education,
            projects,
        }
    }

    private normalizeSkillList(raw: unknown): string[] {
        if (!Array.isArray(raw)) return []
        return [...new Set(
            raw
                .filter((s): s is string => typeof s === 'string' && s.length > 0)
                .map(s => normalizeSkill(s))
                .filter(Boolean) as string[]
        )]
    }
}

export const resumeExtractionService = new ResumeExtractionService()
