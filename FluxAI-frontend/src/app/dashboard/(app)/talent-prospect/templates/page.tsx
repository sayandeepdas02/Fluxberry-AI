"use client"

import { PageContainer } from "@/components/dashboard/page-container"
import { useQuery } from "@tanstack/react-query"
import { useApiMutation } from "@/lib/hooks/use-api-mutation"
import { apiClient } from "@/lib/api/client"
import { ApiResponse } from "@/lib/api/types"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Loader2, FileText, Plus, Pencil, Trash2, Variable } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface EmailTemplate {
    _id: string
    name: string
    subject: string
    content: string
    variables: string[]
    isActive: boolean
    createdAt: string
}

const emailTemplatesApi = {
    list: (): Promise<ApiResponse<EmailTemplate[]>> => apiClient.get('/email-templates'),
    create: (data: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> => apiClient.post('/email-templates', data),
    update: (id: string, data: Partial<EmailTemplate>): Promise<ApiResponse<EmailTemplate>> => apiClient.patch(`/email-templates/${id}`, data),
    delete: (id: string): Promise<ApiResponse<any>> => apiClient.delete(`/email-templates/${id}`),
}

const VARIABLE_CHIPS = ['firstName', 'lastName', 'company', 'role']

export default function OutreachTemplatesPage() {
    const [showEditor, setShowEditor] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [subject, setSubject] = useState('')
    const [content, setContent] = useState('')

    const { data: response, isLoading } = useQuery({
        queryKey: ['email-templates'],
        queryFn: () => emailTemplatesApi.list(),
    })
    const templates = response?.data || []

    const saveMutation = useApiMutation({
        mutationFn: (data: Partial<EmailTemplate>) => {
            // Auto-detect variables
            const vars = (data.content || '').match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{|\}/g, '')) || []
            const subjVars = (data.subject || '').match(/\{\{(\w+)\}\}/g)?.map(v => v.replace(/\{|\}/g, '')) || []
            const allVars = [...new Set([...vars, ...subjVars])]

            if (editingId) {
                return emailTemplatesApi.update(editingId, { ...data, variables: allVars })
            }
            return emailTemplatesApi.create({ ...data, variables: allVars })
        },
        successMessage: editingId ? 'Template updated' : 'Template created',
        invalidateKeys: [['email-templates']],
        onSuccess: () => {
            resetEditor()
        },
    })

    const deleteMutation = useApiMutation({
        mutationFn: (id: string) => emailTemplatesApi.delete(id),
        successMessage: 'Template deleted',
        invalidateKeys: [['email-templates']],
    })

    const resetEditor = () => {
        setShowEditor(false)
        setEditingId(null)
        setName('')
        setSubject('')
        setContent('')
    }

    const startEdit = (t: EmailTemplate) => {
        setEditingId(t._id)
        setName(t.name)
        setSubject(t.subject)
        setContent(t.content)
        setShowEditor(true)
    }

    const insertVariable = (varName: string) => {
        setContent(prev => prev + `{{${varName}}}`)
    }

    return (
        <PageContainer title="Email Templates" description="Create and manage reusable templates for outreach campaigns.">
            <div className="mt-6 flex flex-col space-y-6">
                {/* ── Actions Bar ─────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? 's' : ''}</p>
                    <button
                        onClick={() => { resetEditor(); setShowEditor(true) }}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        New Template
                    </button>
                </div>

                {/* ── Editor ──────────────────────────────────────── */}
                {showEditor && (
                    <div className="p-6 border border-line rounded-lg bg-card/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <h3 className="font-semibold text-sm">{editingId ? 'Edit Template' : 'New Template'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                placeholder="Template name (e.g. 'Cold Outreach v1')"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-card"
                                autoFocus
                            />
                            <Input
                                placeholder="Subject line — use {{firstName}} etc."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-card"
                            />
                        </div>

                        {/* Variable chips */}
                        <div className="flex items-center gap-2">
                            <Variable className="w-4 h-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Insert:</span>
                            {VARIABLE_CHIPS.map(v => (
                                <button
                                    key={v}
                                    onClick={() => insertVariable(v)}
                                    className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent rounded hover:bg-accent/20 transition-colors"
                                >
                                    {`{{${v}}}`}
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder="Email body — supports {{variables}} for personalization..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={8}
                            className="w-full px-4 py-3 text-sm bg-card border border-line rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-accent"
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (!name || !subject || !content) return toast.error('All fields are required')
                                    saveMutation.mutate({ name, subject, content })
                                }}
                                disabled={saveMutation.isPending}
                                className="px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                            >
                                {editingId ? 'Update' : 'Create'} Template
                            </button>
                            <button onClick={resetEditor} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                    </div>
                )}

                {/* ── Template Cards ──────────────────────────────── */}
                {isLoading ? (
                    <div className="flex h-64 items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : templates.length === 0 && !showEditor ? (
                    <EmptyState
                        icon={FileText}
                        title="No templates yet"
                        description="Create email templates with personalization variables to power your outreach campaigns."
                        actions={[
                            { label: 'Create Template', onClick: () => setShowEditor(true), variant: 'primary' }
                        ]}
                    />
                ) : (
                    <div className="grid gap-4">
                        {templates.map((t: EmailTemplate) => (
                            <div key={t._id} className="p-5 border border-line rounded-lg bg-card/50 hover:bg-card/80 transition-colors group">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold truncate">{t.name}</h3>
                                            {!t.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1 truncate">
                                            Subject: {t.subject}
                                        </p>
                                        {t.variables?.length > 0 && (
                                            <div className="flex gap-1.5 mt-2">
                                                {t.variables.map(v => (
                                                    <span key={v} className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                                                        {`{{${v}}}`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEdit(t)}
                                            className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirm('Delete this template?')) deleteMutation.mutate(t._id)
                                            }}
                                            className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground/50 mt-3 line-clamp-2">{t.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PageContainer>
    )
}
