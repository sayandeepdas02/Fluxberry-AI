import mongoose, { Schema, Document, Types } from 'mongoose'

export const WorkflowTrigger = {
    APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
    STAGE_CHANGED: 'STAGE_CHANGED',
    SCORE_SUBMITTED: 'SCORE_SUBMITTED',
    TAG_ADDED: 'TAG_ADDED',
    DISQUALIFIED: 'DISQUALIFIED',
    SCREENING_COMPLETED: 'SCREENING_COMPLETED',
    SCREENING_SCORE_ABOVE: 'SCREENING_SCORE_ABOVE',
    SCREENING_SCORE_BELOW: 'SCREENING_SCORE_BELOW',
    AI_SCREENING_COMPLETED: 'AI_SCREENING_COMPLETED',
    RESUME_PARSE_FAILED: 'RESUME_PARSE_FAILED',
} as const
export type WorkflowTriggerType = typeof WorkflowTrigger[keyof typeof WorkflowTrigger]

// Condition Operators
export const ConditionOperator = {
    EQUALS: 'EQUALS',
    NOT_EQUALS: 'NOT_EQUALS',
    CONTAINS: 'CONTAINS',
    GREATER_THAN: 'GREATER_THAN',
    LESS_THAN: 'LESS_THAN',
    EXISTS: 'EXISTS',
} as const
export type ConditionOperatorType = typeof ConditionOperator[keyof typeof ConditionOperator]

// Action Types
export const ActionType = {
    SEND_EMAIL: 'SEND_EMAIL',
    MOVE_STAGE: 'MOVE_STAGE',
    ADD_TAG: 'ADD_TAG',
    ASSIGN_RECRUITER: 'ASSIGN_RECRUITER',
    SEND_SLACK_NOTIFICATION: 'SEND_SLACK_NOTIFICATION', // Future
} as const
export type ActionTypeValue = typeof ActionType[keyof typeof ActionType]

// ----------------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------------

export interface IWorkflowCondition {
    field: string // e.g., 'stage', 'score', 'source'
    operator: ConditionOperatorType
    value: string | number | boolean | string[]
}

export interface IWorkflowAction {
    type: ActionTypeValue
    config: Record<string, unknown> // e.g., { templateId: '...', to: 'candidate' }
}

export interface IWorkflowRule extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    isActive: boolean
    trigger: WorkflowTriggerType
    conditions: IWorkflowCondition[]
    actions: IWorkflowAction[]
    createdAt: Date
    updatedAt: Date
}

// ----------------------------------------------------------------------
// Schemas
// ----------------------------------------------------------------------

const WorkflowConditionSchema = new Schema<IWorkflowCondition>({
    field: { type: String, required: true },
    operator: { type: String, enum: Object.values(ConditionOperator), required: true },
    value: { type: Schema.Types.Mixed, required: true },
}, { _id: false })

const WorkflowActionSchema = new Schema<IWorkflowAction>({
    type: { type: String, enum: Object.values(ActionType), required: true },
    config: { type: Schema.Types.Mixed, default: {} },
}, { _id: false })

const WorkflowRuleSchema = new Schema<IWorkflowRule>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    trigger: { type: String, enum: Object.values(WorkflowTrigger), required: true, index: true },
    conditions: [WorkflowConditionSchema],
    actions: [WorkflowActionSchema],
}, { timestamps: true })

WorkflowRuleSchema.index({ organizationId: 1, trigger: 1, isActive: 1 })

export const WorkflowRule = mongoose.model<IWorkflowRule>('WorkflowRule', WorkflowRuleSchema)
