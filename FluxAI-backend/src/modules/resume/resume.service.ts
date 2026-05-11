/**
 * ResumeService — Single entry point for resume parsing and extraction.
 *
 * Wraps the two-step pipeline:
 *   1. Text extraction  (PDF/DOCX → raw text)
 *   2. GPT extraction   (raw text → structured IResumeParsedData)
 *
 * Callers get a single `parseAndExtract(url)` method instead of
 * orchestrating both services separately.
 */

import { resumeParsingService, type ResumeParseResult } from '../../services/resume-parsing.service.js'
import { resumeExtractionService } from '../../services/resume-extraction.service.js'
import type { IResumeParsedData } from '../ats-screening/models/resume-profile.model.js'

export interface ResumeParseAndExtractResult {
    parseResult: ResumeParseResult
    structuredData: IResumeParsedData | null
}

class ResumeService {
    /**
     * Parse a resume file and extract structured data in one call.
     *
     * Returns `structuredData: null` when the file could not be parsed
     * (check `parseResult.status !== 'PARSED'` to detect this case).
     */
    async parseAndExtract(resumeUrl: string): Promise<ResumeParseAndExtractResult> {
        const parseResult = await resumeParsingService.parse(resumeUrl)

        if (parseResult.status !== 'PARSED') {
            return { parseResult, structuredData: null }
        }

        const structuredData = await resumeExtractionService.extract(parseResult.rawText)
        return { parseResult, structuredData }
    }
}

export const resumeService = new ResumeService()
