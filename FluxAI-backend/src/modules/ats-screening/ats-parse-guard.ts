import { IResumeParsedData } from './models/resume-profile.model.js';

/**
 * Validates that parsed resume data is complete enough for reliable scoring.
 *
 * Rules:
 * - Must be defined (not null/undefined)
 * - Must have at least 1 skill listed
 * - Experience array must be present (can be empty — candidate may be a fresher)
 * - Education array must be present and defined
 *
 * If this returns false, the candidate should NOT be scored.
 * Their ScreeningResult should be set to PARSE_FAILED with reason INVALID_FORMAT.
 */
export function isParsedDataValid(parsedData: IResumeParsedData | null | undefined): parsedData is IResumeParsedData {
    if (!parsedData) return false;

    // Must have at least some skills — empty skills makes skill scoring meaningless
    if (!parsedData.skills || parsedData.skills.length === 0) return false;

    // Experience must be a defined array (even if empty — we'll score it as 0 exp)
    if (parsedData.experience === undefined) return false;

    // Education must be a defined array
    if (parsedData.education === undefined) return false;

    return true;
}

/**
 * Returns a structured log context object for consistent logging across the ATS pipeline.
 */
export function atsLogContext(params: {
    candidateId: string;
    jobId: string;
    organizationId: string;
    retryCount?: number;
    failureReason?: string;
}) {
    return {
        module:   'ATS_SCREENING',
        ...params,
    };
}
