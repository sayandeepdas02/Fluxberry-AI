import mongoose, { Schema, Document, Types } from 'mongoose'

/* ════════════════════════════════════════════════════
   WORKFLOW DEFINITION — DAG-based visual workflows
   ════════════════════════════════════════════════════ */

export const WorkflowNodeType = {
    TRIGGER: 'trigger',
    ACTION: 'action',
    CONDITION: 'condition',
    DELAY: 'delay',
    BRANCH: 'branch',
    END: 'end',
} as const
export type WorkflowNodeTypeValue = typeof WorkflowNodeType[keyof typeof WorkflowNodeType]

export interface IWorkflowNode {
    id: string
    type: WorkflowNodeTypeValue
    label: string
    config: Record<string, unknown>
    position?: { x: number; y: number } // For visual builder
}

export interface IWorkflowEdge {
    id: string
    source: string
    target: string
    label?: string
    condition?: Record<string, unknown>
}

export interface IWorkflowDefinition extends Document {
    _id: Types.ObjectId
    organizationId: Types.ObjectId
    name: string
    description?: string
    isActive: boolean
    trigger: string
    nodes: IWorkflowNode[]
    edges: IWorkflowEdge[]
    version: number
    createdBy: Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

const WorkflowNodeSchema = new Schema<IWorkflowNode>({
    id: { type: String, required: true },
    type: { type: String, enum: Object.values(WorkflowNodeType), required: true },
    label: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    position: { x: { type: Number }, y: { type: Number } },
}, { _id: false })

const WorkflowEdgeSchema = new Schema<IWorkflowEdge>({
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    label: { type: String },
    condition: { type: Schema.Types.Mixed },
}, { _id: false })

const WorkflowDefinitionSchema = new Schema<IWorkflowDefinition>({
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    trigger: { type: String, required: true, index: true },
    nodes: [WorkflowNodeSchema],
    edges: [WorkflowEdgeSchema],
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

WorkflowDefinitionSchema.index({ organizationId: 1, isActive: 1 })

export const WorkflowDefinition = mongoose.model<IWorkflowDefinition>('WorkflowDefinition', WorkflowDefinitionSchema)

/* ════════════════════════════════════════════════════
   WORKFLOW EXECUTION — Runtime state of a workflow run
   ════════════════════════════════════════════════════ */

export const WorkflowExecutionStatus = {
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PAUSED: 'paused',
    WAITING: 'waiting', // waiting on delay
} as const
export type WorkflowExecutionStatusValue = typeof WorkflowExecutionStatus[keyof typeof WorkflowExecutionStatus]

export interface INodeExecution {
    nodeId: string
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
    startedAt?: Date
    completedAt?: Date
    result?: Record<string, unknown>
    error?: string
}

export interface IWorkflowExecution extends Document {
    _id: Types.ObjectId
    definitionId: Types.ObjectId
    organizationId: Types.ObjectId
    entityId: string
    entityType: string
    status: WorkflowExecutionStatusValue
    currentNodeId?: string
    nodeHistory: INodeExecution[]
    triggerData: Record<string, unknown>
    startedAt: Date
    completedAt?: Date
    error?: string
    createdAt: Date
    updatedAt: Date
}

const NodeExecutionSchema = new Schema<INodeExecution>({
    nodeId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed', 'skipped'], default: 'pending' },
    startedAt: { type: Date },
    completedAt: { type: Date },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
}, { _id: false })

const WorkflowExecutionSchema = new Schema<IWorkflowExecution>({
    definitionId: { type: Schema.Types.ObjectId, ref: 'WorkflowDefinition', required: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    entityId: { type: String, required: true },
    entityType: { type: String, required: true },
    status: { type: String, enum: Object.values(WorkflowExecutionStatus), default: WorkflowExecutionStatus.RUNNING },
    currentNodeId: { type: String },
    nodeHistory: [NodeExecutionSchema],
    triggerData: { type: Schema.Types.Mixed, default: {} },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    error: { type: String },
}, { timestamps: true })

WorkflowExecutionSchema.index({ definitionId: 1, status: 1 })
WorkflowExecutionSchema.index({ organizationId: 1, entityId: 1 })

export const WorkflowExecution = mongoose.model<IWorkflowExecution>('WorkflowExecution', WorkflowExecutionSchema)
