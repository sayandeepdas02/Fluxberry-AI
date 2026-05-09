import { Schema } from 'mongoose'

export function softDeletePlugin(schema: Schema): void {
    // Add deletedAt field if not present
    if (!schema.path('deletedAt')) {
        schema.add({ deletedAt: { type: Date, default: null } })
    }

    // Auto-exclude soft-deleted docs in find queries
    schema.pre(/^find/, function(this: any) {
        if (!this.getOptions().includeSoftDeleted) {
            this.where({ deletedAt: null })
        }
    })

    // Soft delete instance method
    schema.methods.softDelete = async function() {
        this.deletedAt = new Date()
        await this.save()
    }

    // Restore instance method
    schema.methods.restore = async function() {
        this.deletedAt = null
        await this.save()
    }
}
