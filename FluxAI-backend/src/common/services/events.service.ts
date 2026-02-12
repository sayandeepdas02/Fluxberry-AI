import { EventEmitter } from 'events'
import { WorkflowTrigger, WorkflowTriggerType } from '../../database/models/workflow.models.js'

export const DomainEvent = {
    ...WorkflowTrigger
}

class FluxEvents extends EventEmitter {
    constructor() {
        super()
    }

    emitDomainEvent(event: WorkflowTriggerType, payload: any) {
        console.log(`[DomainEvent] ${event}`, JSON.stringify(payload, null, 2))
        this.emit(event, payload)
    }
}

export const fluxEvents = new FluxEvents()
