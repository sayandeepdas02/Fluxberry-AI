export enum WorkflowTrigger {
    APPLICATION_SUBMITTED = 'APPLICATION_SUBMITTED',
    STAGE_CHANGED = 'STAGE_CHANGED',
    SCORE_SUBMITTED = 'SCORE_SUBMITTED',
    TAG_ADDED = 'TAG_ADDED',
    DISQUALIFIED = 'DISQUALIFIED',
    SCREENING_COMPLETED = 'SCREENING_COMPLETED',
    SCREENING_SCORE_ABOVE = 'SCREENING_SCORE_ABOVE',
    SCREENING_SCORE_BELOW = 'SCREENING_SCORE_BELOW',
}

export enum ConditionOperator {
    EQUALS = 'EQUALS',
    NOT_EQUALS = 'NOT_EQUALS',
    CONTAINS = 'CONTAINS',
    GREATER_THAN = 'GREATER_THAN',
    LESS_THAN = 'LESS_THAN',
    EXISTS = 'EXISTS',
}

export enum ActionType {
    SEND_EMAIL = 'SEND_EMAIL',
    MOVE_STAGE = 'MOVE_STAGE',
    ADD_TAG = 'ADD_TAG',
    ASSIGN_RECRUITER = 'ASSIGN_RECRUITER',
}

export interface IWorkflowCondition {
    field: string
    operator: ConditionOperator
    value?: string
}

export interface IWorkflowAction {
    type: ActionType
    config: Record<string, string>
}

export interface IWorkflowRule {
    _id: string
    organizationId: string
    name: string
    isActive: boolean
    trigger: WorkflowTrigger
    conditions: IWorkflowCondition[]
    actions: IWorkflowAction[]
    createdAt: string
    updatedAt: string
}
