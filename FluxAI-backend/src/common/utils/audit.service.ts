import { AuditLog } from '../../database/models/index.js'
import { EventEmitter } from 'events'

// Event emitter for audit events — allows decoupled listeners
export const auditEmitter = new EventEmitter()

interface AuditParams {
    organizationId: string
    entityType: string
    entityId: string
    action: string
    previousValue?: Record<string, unknown>
    newValue?: Record<string, unknown>
    performedBy?: string
}

class AuditService {
    /**
     * Log an audit event and emit it
     */
    async log(params: AuditParams): Promise<void> {
        try {
            await AuditLog.create({
                organizationId: params.organizationId,
                entityType: params.entityType,
                entityId: params.entityId,
                action: params.action,
                previousValue: params.previousValue,
                newValue: params.newValue,
                performedBy: params.performedBy,
            })

            // Emit event for any decoupled listeners (e.g., notifications, webhooks)
            auditEmitter.emit('audit', params)
        } catch (err) {
            console.error('[AuditService] Failed to create audit log:', err)
        }
    }

    /**
     * Convenience methods for common audit actions
     */
    async logStageMove(params: {
        organizationId: string
        applicationId: string
        fromStage: string
        toStage: string
        performedBy: string
    }): Promise<void> {
        return this.log({
            organizationId: params.organizationId,
            entityType: 'JobApplication',
            entityId: params.applicationId,
            action: 'STAGE_CHANGE',
            previousValue: { status: params.fromStage },
            newValue: { status: params.toStage },
            performedBy: params.performedBy,
        })
    }

    async logJobPublish(params: {
        organizationId: string
        jobId: string
        performedBy: string
    }): Promise<void> {
        return this.log({
            organizationId: params.organizationId,
            entityType: 'Job',
            entityId: params.jobId,
            action: 'JOB_PUBLISHED',
            performedBy: params.performedBy,
        })
    }

    async logCandidateReject(params: {
        organizationId: string
        applicationId: string
        performedBy: string
        reason?: string
    }): Promise<void> {
        return this.log({
            organizationId: params.organizationId,
            entityType: 'JobApplication',
            entityId: params.applicationId,
            action: 'CANDIDATE_REJECTED',
            newValue: { reason: params.reason },
            performedBy: params.performedBy,
        })
    }

    async logRoleChange(params: {
        organizationId: string
        userId: string
        fromRole: string
        toRole: string
        performedBy: string
    }): Promise<void> {
        return this.log({
            organizationId: params.organizationId,
            entityType: 'OrganizationMember',
            entityId: params.userId,
            action: 'ROLE_CHANGED',
            previousValue: { role: params.fromRole },
            newValue: { role: params.toRole },
            performedBy: params.performedBy,
        })
    }
}

export const auditService = new AuditService()
