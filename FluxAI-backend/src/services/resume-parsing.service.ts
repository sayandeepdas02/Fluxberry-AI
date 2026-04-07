/**
 * Resume Parsing Service
 *
 * Extracts raw plaintext from uploaded resume files (PDF, DOCX).
 * Stateless — the BullMQ processor owns persistence and lifecycle.
 *
 * Supported formats:
 *   .pdf   → pdf-parse
 *   .docx  → mammoth
 *   .doc   → unsupported (marked with UNSUPPORTED_FORMAT)
 */

import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import path from 'path'
import { getObjectBuffer } from '../modules/storage/s3.client.js'

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export type ResumeParseStatus = 'PARSED' | 'PARSE_FAILED' | 'OCR_REQUIRED' | 'UNSUPPORTED_FORMAT'

export interface ResumeParseResult {
    /** Extracted plaintext (empty string on failure) */
    rawText: string
    /** Detected file extension (lowercase, without dot) */
    fileType: string
    /** Overall parse status */
    status: ResumeParseStatus
    /** Character count of rawText */
    textLength: number
    /** Wall-clock time for parse operation in milliseconds */
    parsingDurationMs: number
    /** Human-readable failure reason (only set on non-PARSED status) */
    failureReason?: string
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

/** Guard against OOM — reject files larger than 25 MB before parsing */
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

/**
 * If a PDF yields fewer characters than this threshold after extraction,
 * it's likely an image-based (scanned) resume.
 */
const IMAGE_PDF_CHAR_THRESHOLD = 50

const SUPPORTED_EXTENSIONS = new Set(['pdf', 'docx'])

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Detect file extension from a URL or storage path.
 * Handles pre-signed S3 URLs with query params, local paths, and encoded paths.
 */
function detectFileType(resumeUrl: string): string {
    try {
        // Strip query params and fragments, then extract extension
        const cleanPath = resumeUrl.split('?')[0].split('#')[0]
        const decoded = decodeURIComponent(cleanPath)
        const ext = path.extname(decoded).toLowerCase().replace('.', '')
        return ext || 'unknown'
    } catch {
        return 'unknown'
    }
}

/**
 * Resolve a resumeUrl to its underlying storage key.
 *
 * Resume URLs come in two formats:
 *   1. S3:    https://<bucket>.s3.<region>.amazonaws.com/<key>
 *   2. Local: /api/uploads/local/<storageKey>  or  http://localhost:5001/api/uploads/local/<storageKey>
 *
 * The S3 client's `getObjectBuffer()` needs the storage key, not the full URL.
 */
function resolveStorageKey(resumeUrl: string): string {
    // Local dev URL — extract storageKey after /api/uploads/local/
    const localPrefix = '/api/uploads/local/'
    const localIdx = resumeUrl.indexOf(localPrefix)
    if (localIdx !== -1) {
        const encoded = resumeUrl.substring(localIdx + localPrefix.length).split('?')[0]
        return decodeURIComponent(encoded)
    }

    // S3 URL — extract the key after the bucket host
    // e.g. https://bucket.s3.us-east-1.amazonaws.com/candidate/.../resume.pdf
    const s3Match = resumeUrl.match(/\.amazonaws\.com\/(.+?)(\?|$)/)
    if (s3Match) {
        return decodeURIComponent(s3Match[1])
    }

    // S3-compatible / MinIO — extract after the bucket path
    // e.g. http://minio:9000/bucket/candidate/.../resume.pdf
    const minioMatch = resumeUrl.match(/\/[^/]+\/(.+?)(\?|$)/)
    if (minioMatch) {
        return decodeURIComponent(minioMatch[1])
    }

    // Fallback: use the whole URL as the key (shouldn't happen in practice)
    return resumeUrl
}

/**
 * Clean and normalize extracted text for embedding consumption.
 *
 * - Strips non-printable / control characters (keeps newlines and tabs)
 * - Collapses runs of whitespace
 * - Normalizes Unicode to NFC form
 * - Trims leading / trailing whitespace
 */
function cleanText(raw: string): string {
    return raw
        // Remove non-printable control characters except \n, \r, \t
        .replace(/[^\P{C}\n\r\t]/gu, '')
        // Collapse multiple spaces/tabs (but keep single newlines)
        .replace(/[^\S\n]+/g, ' ')
        // Collapse 3+ consecutive newlines to 2
        .replace(/\n{3,}/g, '\n\n')
        // Normalize Unicode
        .normalize('NFC')
        .trim()
}

// ──────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────

class ResumeParsingService {
    /**
     * Parse a resume file and extract raw plaintext.
     *
     * This method NEVER throws — it returns a result with a status code.
     * The calling processor decides how to handle each status.
     */
    async parse(resumeUrl: string): Promise<ResumeParseResult> {
        const startTime = Date.now()
        const fileType = detectFileType(resumeUrl)

        // ── Guard: unsupported format ────────────────────────────
        if (!SUPPORTED_EXTENSIONS.has(fileType)) {
            return {
                rawText: '',
                fileType,
                status: fileType === 'doc' ? 'UNSUPPORTED_FORMAT' : 'PARSE_FAILED',
                textLength: 0,
                parsingDurationMs: Date.now() - startTime,
                failureReason: fileType === 'doc'
                    ? 'Legacy .doc format is not supported. Please re-upload as .pdf or .docx.'
                    : `Unsupported file type: .${fileType}`,
            }
        }

        try {
            // ── Fetch file buffer ────────────────────────────────
            const storageKey = resolveStorageKey(resumeUrl)
            const buffer = await getObjectBuffer(storageKey)

            if (!buffer || buffer.length === 0) {
                return {
                    rawText: '',
                    fileType,
                    status: 'PARSE_FAILED',
                    textLength: 0,
                    parsingDurationMs: Date.now() - startTime,
                    failureReason: 'File not found or empty in storage',
                }
            }

            // ── Guard: file size ─────────────────────────────────
            if (buffer.length > MAX_FILE_SIZE_BYTES) {
                return {
                    rawText: '',
                    fileType,
                    status: 'PARSE_FAILED',
                    textLength: 0,
                    parsingDurationMs: Date.now() - startTime,
                    failureReason: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)} MB). Maximum: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
                }
            }

            // ── Extract text ─────────────────────────────────────
            let rawText: string

            if (fileType === 'pdf') {
                rawText = await this.parsePdf(buffer)
            } else {
                rawText = await this.parseDocx(buffer)
            }

            const cleanedText = cleanText(rawText)

            // ── Guard: image-based PDF detection ─────────────────
            if (fileType === 'pdf' && cleanedText.length < IMAGE_PDF_CHAR_THRESHOLD) {
                return {
                    rawText: cleanedText,
                    fileType,
                    status: 'OCR_REQUIRED',
                    textLength: cleanedText.length,
                    parsingDurationMs: Date.now() - startTime,
                    failureReason: `PDF appears to be image-based (only ${cleanedText.length} characters extracted). OCR processing required.`,
                }
            }

            // ── Success ──────────────────────────────────────────
            return {
                rawText: cleanedText,
                fileType,
                status: 'PARSED',
                textLength: cleanedText.length,
                parsingDurationMs: Date.now() - startTime,
            }

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return {
                rawText: '',
                fileType,
                status: 'PARSE_FAILED',
                textLength: 0,
                parsingDurationMs: Date.now() - startTime,
                failureReason: `Extraction error: ${message}`,
            }
        }
    }

    // ── Private extractors ───────────────────────────────────

    private async parsePdf(buffer: Buffer): Promise<string> {
        const parser = new PDFParse({ data: new Uint8Array(buffer) })
        try {
            const result = await parser.getText()
            return result.text
        } finally {
            await parser.destroy().catch(() => {})
        }
    }

    private async parseDocx(buffer: Buffer): Promise<string> {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
    }
}

export const resumeParsingService = new ResumeParsingService()
