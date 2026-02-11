'use client'

import * as React from 'react'
import { Plus, GripVertical, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { ApplicationField, ApplicationSchema } from '@/lib/api/jobs'

interface FormBuilderProps {
    value: ApplicationSchema
    onChange: (schema: ApplicationSchema) => void
}

const FIELD_TYPES: { value: ApplicationField['type']; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Textarea' },
    { value: 'select', label: 'Select / Dropdown' },
    { value: 'file', label: 'File Upload' },
]

const DEFAULT_FIELD: ApplicationField = {
    name: '',
    label: '',
    type: 'text',
    required: false,
}

export function FormBuilder({ value, onChange }: FormBuilderProps) {
    const fields = value.fields || []

    const updateField = (index: number, updates: Partial<ApplicationField>) => {
        const newFields = [...fields]
        newFields[index] = { ...newFields[index], ...updates }

        // Auto-generate name from label
        if (updates.label !== undefined) {
            newFields[index].name = updates.label
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_|_$/g, '')
        }

        onChange({ fields: newFields })
    }

    const addField = () => {
        onChange({
            fields: [...fields, { ...DEFAULT_FIELD, name: `field_${fields.length}`, label: '' }]
        })
    }

    const removeField = (index: number) => {
        onChange({ fields: fields.filter((_, i) => i !== index) })
    }

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields]
        const swapIndex = direction === 'up' ? index - 1 : index + 1
        if (swapIndex < 0 || swapIndex >= newFields.length) return
            ;[newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]]
        onChange({ fields: newFields })
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-foreground">Application Form Fields</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Define the fields candidates will fill out when applying
                    </p>
                </div>
                <button
                    type="button"
                    onClick={addField}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-edge hover:bg-muted/50 transition-colors text-foreground"
                >
                    <Plus className="w-3.5 h-3.5" />
                    Add Field
                </button>
            </div>

            {fields.length === 0 && (
                <div className="border border-dashed border-edge rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                        No fields added yet. Click &ldquo;Add Field&rdquo; to start building your application form.
                    </p>
                </div>
            )}

            <div className="space-y-3">
                {fields.map((field, index) => (
                    <div
                        key={index}
                        className="border border-edge rounded-lg p-4 bg-muted/5 space-y-3"
                    >
                        {/* Field Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <GripVertical className="w-4 h-4 text-muted-foreground/40" />
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Field {index + 1}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => moveField(index, 'up')}
                                    disabled={index === 0}
                                    className="p-1 rounded hover:bg-muted/50 transition-colors disabled:opacity-30"
                                >
                                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveField(index, 'down')}
                                    disabled={index === fields.length - 1}
                                    className="p-1 rounded hover:bg-muted/50 transition-colors disabled:opacity-30"
                                >
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => removeField(index)}
                                    className="p-1 rounded hover:bg-red-500/10 transition-colors text-red-500/60 hover:text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Field Config */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Label</label>
                                <input
                                    type="text"
                                    value={field.label}
                                    onChange={e => updateField(index, { label: e.target.value })}
                                    placeholder="e.g. Full Name"
                                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                                <select
                                    value={field.type}
                                    onChange={e => updateField(index, { type: e.target.value as ApplicationField['type'] })}
                                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                >
                                    {FIELD_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Select Options (for select type) */}
                        {field.type === 'select' && (
                            <div>
                                <label className="text-xs text-muted-foreground mb-1 block">
                                    Options (comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={(field.options || []).join(', ')}
                                    onChange={e => updateField(index, {
                                        options: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                                    })}
                                    placeholder="e.g. Frontend, Backend, Fullstack"
                                    className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                                />
                            </div>
                        )}

                        {/* Required toggle */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={field.required || false}
                                onChange={e => updateField(index, { required: e.target.checked })}
                                className="w-3.5 h-3.5 rounded border-input"
                            />
                            <span className="text-xs text-muted-foreground">Required</span>
                        </label>
                    </div>
                ))}
            </div>

            {/* Preview */}
            {fields.length > 0 && (
                <div className="border-t border-edge pt-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Preview
                    </h4>
                    <div className="border border-edge rounded-lg p-4 space-y-3 bg-muted/5">
                        {fields.map((field, index) => (
                            <div key={index}>
                                <label className="text-sm text-foreground block mb-1">
                                    {field.label || `Field ${index + 1}`}
                                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                                </label>
                                {field.type === 'textarea' ? (
                                    <div className="w-full h-16 rounded-md border border-input bg-muted/10" />
                                ) : field.type === 'select' ? (
                                    <div className="w-full h-9 rounded-md border border-input bg-muted/10 flex items-center px-3 text-xs text-muted-foreground/50">
                                        Select {field.label || '...'}
                                    </div>
                                ) : field.type === 'file' ? (
                                    <div className="w-full h-9 rounded-md border border-dashed border-input bg-muted/10 flex items-center justify-center text-xs text-muted-foreground/50">
                                        Choose file...
                                    </div>
                                ) : (
                                    <div className="w-full h-9 rounded-md border border-input bg-muted/10" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
