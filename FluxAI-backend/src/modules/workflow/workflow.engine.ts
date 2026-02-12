import { fluxEvents, DomainEvent } from '../../common/services/events.service.js'
import { WorkflowRule, WorkflowTriggerType, ConditionOperator, IWorkflowCondition, IWorkflowAction } from '../../database/models/workflow.models.js'
import { enqueueWorkflowJob } from '../../jobs/queues/index.js'
import { Types } from 'mongoose'

class WorkflowEngine {
    constructor() {
        this.initializeListeners()
    }

    private initializeListeners() {
        console.log('🤖 Workflow Engine Initialized')

        // Listen to all defined trigger types
        Object.values(DomainEvent).forEach((trigger) => {
            fluxEvents.on(trigger as WorkflowTriggerType, async (payload) => {
                await this.evaluateRules(trigger as WorkflowTriggerType, payload)
            })
        })
    }

    private async evaluateRules(trigger: WorkflowTriggerType, payload: any) {
        const { organizationId, entityId, entityType } = payload
        console.log(`🤖 Evaluating rules for trigger: ${trigger} on ${entityType}:${entityId}`)

        try {
            // Fetch active rules for this trigger and organization
            const rules = await WorkflowRule.find({
                organizationId: new Types.ObjectId(organizationId),
                trigger,
                isActive: true,
            })

            if (rules.length === 0) return

            for (const rule of rules) {
                const isMatch = this.checkConditions(rule.conditions, payload)
                if (isMatch) {
                    console.log(`✅ Rule Matched: "${rule.name}"`)
                    await this.executeActions(rule.actions, payload)
                }
            }

        } catch (error: any) {
            console.error(`❌ Error evaluating workflow rules: ${error.message}`)
        }
    }

    private checkConditions(conditions: IWorkflowCondition[], payload: any): boolean {
        if (!conditions || conditions.length === 0) return true // No conditions = always run

        return conditions.every((condition) => {
            const actualValue = this.getValueFromPayload(payload, condition.field)

            switch (condition.operator) {
                case ConditionOperator.EQUALS:
                    return actualValue == condition.value
                case ConditionOperator.NOT_EQUALS:
                    return actualValue != condition.value
                case ConditionOperator.CONTAINS:
                    return Array.isArray(actualValue)
                        ? actualValue.includes(condition.value)
                        : String(actualValue).includes(String(condition.value))
                case ConditionOperator.GREATER_THAN:
                    return Number(actualValue) > Number(condition.value)
                case ConditionOperator.LESS_THAN:
                    return Number(actualValue) < Number(condition.value)
                case ConditionOperator.EXISTS:
                    return actualValue !== undefined && actualValue !== null
                default:
                    return false
            }
        })
    }

    private getValueFromPayload(payload: any, fieldPath: string): any {
        return fieldPath.split('.').reduce((obj, key) => obj?.[key], payload)
    }

    private async executeActions(actions: IWorkflowAction[], payload: any) {
        const { entityId, entityType, organizationId } = payload

        for (const action of actions) {
            await enqueueWorkflowJob({
                actionType: action.type,
                actionConfig: action.config,
                entityId,
                entityType,
                organizationId,
                triggerData: payload
            })
        }
    }
}

export const workflowEngine = new WorkflowEngine()
