/**
 * Application Schema Validator
 * Validates submitted application data against a job's applicationSchema.
 * 
 * applicationSchema format:
 * {
 *   fields: [
 *     { name: "firstName", label: "First Name", type: "text", required: true },
 *     { name: "email", label: "Email", type: "email", required: true },
 *     { name: "experience", label: "Years of Experience", type: "number", required: false },
 *     { name: "coverLetter", label: "Cover Letter", type: "textarea", required: false },
 *     { name: "role", label: "Preferred Role", type: "select", required: true, options: ["Frontend", "Backend", "Fullstack"] },
 *     { name: "resume", label: "Resume", type: "file", required: true },
 *   ]
 * }
 */

export interface ApplicationField {
    name: string
    label: string
    type: 'text' | 'email' | 'number' | 'file' | 'select' | 'textarea'
    required?: boolean
    options?: string[] // for select type
}

export interface ApplicationSchema {
    fields: ApplicationField[]
}

export interface ValidationResult {
    valid: boolean
    errors: { field: string; message: string }[]
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

/**
 * Validate application data against the job's application schema
 */
export function validateApplicationData(
    schema: ApplicationSchema | Record<string, unknown> | undefined,
    data: Record<string, unknown>
): ValidationResult {
    const errors: { field: string; message: string }[] = []

    if (!schema || !('fields' in schema) || !Array.isArray((schema as ApplicationSchema).fields)) {
        // No schema defined — accept any data
        return { valid: true, errors: [] }
    }

    const fields = (schema as ApplicationSchema).fields
    const knownFieldNames = new Set(fields.map(f => f.name))

    // Check for unknown fields
    for (const key of Object.keys(data)) {
        if (!knownFieldNames.has(key) && key !== 'resumeFileId') {
            errors.push({ field: key, message: `Unknown field: ${key}` })
        }
    }

    // Validate each schema field
    for (const field of fields) {
        const value = data[field.name]

        // Required check
        if (field.required && (value === undefined || value === null || value === '')) {
            errors.push({ field: field.name, message: `${field.label} is required` })
            continue
        }

        // Skip validation if not provided and not required
        if (value === undefined || value === null || value === '') {
            continue
        }

        // Type-specific validation
        switch (field.type) {
            case 'email':
                if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
                    errors.push({ field: field.name, message: `${field.label} must be a valid email address` })
                }
                break

            case 'number':
                if (typeof value !== 'number' && isNaN(Number(value))) {
                    errors.push({ field: field.name, message: `${field.label} must be a number` })
                }
                break

            case 'text':
            case 'textarea':
                if (typeof value !== 'string') {
                    errors.push({ field: field.name, message: `${field.label} must be a string` })
                }
                break

            case 'select':
                if (field.options && !field.options.includes(String(value))) {
                    errors.push({ field: field.name, message: `${field.label} must be one of: ${field.options.join(', ')}` })
                }
                break

            case 'file':
                // File validation is handled separately (via upload URL)
                // Just ensure a string reference is provided
                if (typeof value !== 'string') {
                    errors.push({ field: field.name, message: `${field.label} must be a file reference` })
                }
                break
        }
    }

    return {
        valid: errors.length === 0,
        errors
    }
}
