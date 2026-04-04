import { EventEmitter } from 'events'
import { WorkflowTrigger, WorkflowTriggerType } from '../../database/models/workflow.models.js'

// Export DomainEvent alias for convenience
export const DomainEvent = {
    ...WorkflowTrigger
}

type PayloadMap = {
    [key in WorkflowTriggerType]: any;
}

class EventBus {
    private emitter: EventEmitter
    
    constructor() {
        this.emitter = new EventEmitter()
        // Increase max listeners for large scale
        this.emitter.setMaxListeners(50)
    }

    emit<K extends WorkflowTriggerType>(eventName: K, payload: PayloadMap[K]): void {
        console.log(`[EventBus] ${eventName}`, JSON.stringify(payload, null, 2))
        this.emitter.emit(eventName, payload)
    }

    on<K extends WorkflowTriggerType>(eventName: K, listener: (payload: PayloadMap[K]) => void): void {
        this.emitter.on(eventName, listener)
    }

    off<K extends WorkflowTriggerType>(eventName: K, listener: (payload: PayloadMap[K]) => void): void {
        this.emitter.off(eventName, listener)
    }
}

// Global singleton instance
export const eventBus = new EventBus()
