import mongoose, { Schema, Document, Types } from 'mongoose';

// ─────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────

/**
 * Lifecycle status of a screening result.
 *
 * Legacy values (PASSED, FAILED_GATE, PENDING, ERROR) are kept for
 * backward-compatibility with existing DB documents.
 *
 * New values added in the P0 refactor:
 * - AWAITING_PARSE       → resume has not yet been parsed; job will retry
 * - PARSE_FAILED         → resume parse retries exhausted; candidate NOT scored
 * - SCORING_IN_PROGRESS  → worker has started scoring (idempotent sentinel)
 * - SCORED               → scoring completed successfully (replaces PASSED/FAILED logic)
 */
export const ScreeningStatus = {
    // Legacy (kept for backward-compat)
    PENDING:             'PENDING',
    PASSED:              'PASSED',
    FAILED_GATE:         'FAILED_GATE',
    ERROR:               'ERROR',
    // New states
    AWAITING_PARSE:      'AWAITING_PARSE',
    PARSE_FAILED:        'PARSE_FAILED',
    SCORING_IN_PROGRESS: 'SCORING_IN_PROGRESS',
    SCORED:              'SCORED',
} as const

export type ScreeningStatusType = typeof ScreeningStatus[keyof typeof ScreeningStatus]

/**
 * Reason for a PARSE_FAILED status.
 * Null means no error.
 */
export type ParseErrorReason = 'PARSE_TIMEOUT' | 'INVALID_FORMAT' | null

// ─────────────────────────────────────────────
// Numeric priority for deterministic DB sorting.
// Lower number = higher priority in ranked list.
// ─────────────────────────────────────────────
export const STATUS_PRIORITY: Record<string, number> = {
    SCORED:              1,
    PASSED:              1,   // Legacy compat — treated same as SCORED
    FAILED_GATE:         2,   // Scored but hard-gate failed — still ranked
    REVIEW:              2,   // Decision-level alias
    AWAITING_PARSE:      3,
    PENDING:             3,
    SCORING_IN_PROGRESS: 3,
    PARSE_FAILED:        4,
    ERROR:               5,
}

export function deriveStatusPriority(status: string): number {
    return STATUS_PRIORITY[status] ?? 5
}

// ─────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────

export interface IScoreBreakdown {
    skillScore: number;
    experienceScore: number;
    projectScore: number;
    educationScore: number;
    bonusScore: number;
    // V2 extensions (optional for backward compat)
    signalBoostScore?: number;
    insights?: string[];
    skillMatchDetails?: Array<{
        skill: string;
        bestMatch: string;
        similarity: number;
        strength: 'strong' | 'partial' | 'none';
    }>;
}

export interface IScreeningResult extends Document {
    _id: Types.ObjectId;
    candidateId: Types.ObjectId;
    jobId: Types.ObjectId;
    organizationId: Types.ObjectId;

    status: ScreeningStatusType;
    hardGateFailureReason?: string;

    /** Reason a candidate is in PARSE_FAILED state. */
    errorReason?: ParseErrorReason;

    /** Numeric priority used for deterministic sort (lower = shown first). */
    statusPriority?: number;

    scoreBreakdown?: IScoreBreakdown;
    finalScore?: number;
    confidenceScore?: number;
    scoringVersion: string;

    /** V2: Human-readable explainability insights */
    insights?: string[];
    /** V2: Per-skill match details for recruiter drill-down */
    skillMatchDetails?: {
        skill: string;
        bestMatch: string;
        similarity: number;
    }[];

    manualOverride?: {
        decision: 'SHORTLISTED' | 'REVIEW' | 'REJECTED';
        reason?: string;
        updatedBy?: Types.ObjectId;
        updatedAt?: Date;
    };

    createdAt: Date;
    updatedAt: Date;
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────

const ScreeningResultSchema = new Schema<IScreeningResult>({
    candidateId:   { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobId:         { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    organizationId:{ type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    status: {
        type: String,
        enum: Object.values(ScreeningStatus),
        default: ScreeningStatus.AWAITING_PARSE,
    },
    hardGateFailureReason: { type: String },
    errorReason: {
        type: String,
        enum: ['PARSE_TIMEOUT', 'INVALID_FORMAT', null],
        default: null,
    },
    statusPriority: { type: Number, index: true },

    scoreBreakdown: {
        skillScore:      { type: Number, default: 0 },
        experienceScore: { type: Number, default: 0 },
        projectScore:    { type: Number, default: 0 },
        educationScore:  { type: Number, default: 0 },
        bonusScore:      { type: Number, default: 0 },
        // V2 extensions
        signalBoostScore:  { type: Number },
        insights:          [{ type: String }],
        skillMatchDetails: [{ type: Schema.Types.Mixed }],
    },
    finalScore:     { type: Number, default: 0 },
    confidenceScore:{ type: Number, default: 0 },
    scoringVersion: { type: String, required: true, default: 'unknown' },

    insights: [{ type: String }],
    skillMatchDetails: [{
        skill:      { type: String },
        bestMatch:  { type: String },
        similarity: { type: Number },
    }],

    manualOverride: {
        decision: { type: String, enum: ['SHORTLISTED', 'REVIEW', 'REJECTED'] },
        reason:   { type: String },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date },
    },
}, { timestamps: true });

// Primary sort index: statusPriority ASC, finalScore DESC
ScreeningResultSchema.index({ jobId: 1, statusPriority: 1, finalScore: -1 });
// Legacy index kept for any existing queries that sort by finalScore only
ScreeningResultSchema.index({ jobId: 1, finalScore: -1 });
// Strict tenant isolation
ScreeningResultSchema.index({ organizationId: 1, candidateId: 1, jobId: 1 }, { unique: true });

export const ScreeningResult = mongoose.model<IScreeningResult>('ScreeningResult', ScreeningResultSchema);
