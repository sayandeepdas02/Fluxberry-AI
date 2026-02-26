'use client'

import { useEffect, useState, useCallback } from "react"
import { offersApi, IOfferTemplate, CreateTemplateInput } from "@/lib/api/offers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import {
    Plus,
    FileText,
    Search,
    Edit2,
    Copy,
    MoreHorizontal,
    Braces,
    LayoutTemplate,
    Eye,
} from "lucide-react"
import { toast } from "sonner"

export function TemplateManager() {
    const [templates, setTemplates] = useState<IOfferTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)
    const [previewTemplate, setPreviewTemplate] = useState<IOfferTemplate | null>(null)
    const [editingTemplate, setEditingTemplate] = useState<IOfferTemplate | null>(null)

    // Form state
    const [formName, setFormName] = useState("")
    const [formContent, setFormContent] = useState("")
    const [formType, setFormType] = useState<"FULL_TIME" | "INTERN" | "CONTRACTOR">("FULL_TIME")
    const [formCountry, setFormCountry] = useState("")
    const [formSaving, setFormSaving] = useState(false)

    const fetchTemplates = useCallback(async () => {
        setLoading(true)
        try {
            const response = await offersApi.getTemplates()
            if (response.success && response.data) {
                setTemplates(response.data)
            }
        } catch (err: any) {
            console.error('Failed to fetch templates:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    const handleCreate = async () => {
        if (!formName.trim() || !formContent.trim()) {
            toast.error('Name and content are required')
            return
        }
        setFormSaving(true)
        try {
            // Extract variables from content (format: {{variableName}})
            const variableMatches = formContent.match(/\{\{(\w+)\}\}/g) || []
            const variables = [...new Set(variableMatches.map(v => v.replace(/\{\{|\}\}/g, '')))]

            const data: CreateTemplateInput = {
                name: formName.trim(),
                type: formType,
                country: formCountry,
                htmlContent: formContent,
                variables,
            }

            if (editingTemplate) {
                const response = await offersApi.updateTemplate(editingTemplate._id, data)
                if (response.success && response.data) {
                    setTemplates(prev => prev.map(t => t._id === editingTemplate._id ? response.data! : t))
                    toast.success('Template updated')
                }
            } else {
                const response = await offersApi.createTemplate(data)
                if (response.success && response.data) {
                    setTemplates(prev => [response.data!, ...prev])
                    toast.success('Template created')
                }
            }

            resetForm()
        } catch (err: any) {
            toast.error(err.message || 'Failed to save template')
        } finally {
            setFormSaving(false)
        }
    }

    const resetForm = () => {
        setFormName("")
        setFormContent("")
        setFormType("FULL_TIME")
        setFormCountry("")
        setEditingTemplate(null)
        setIsCreateOpen(false)
    }

    const openEdit = (template: IOfferTemplate) => {
        setEditingTemplate(template)
        setFormName(template.name)
        setFormContent(template.htmlContent)
        setFormType(template.type || "FULL_TIME")
        setFormCountry(template.country || "")
        setIsCreateOpen(true)
    }

    const openPreview = (template: IOfferTemplate) => {
        setPreviewTemplate(template)
        setIsPreviewOpen(true)
    }

    const duplicateTemplate = async (template: IOfferTemplate) => {
        try {
            const data: CreateTemplateInput = {
                name: `${template.name} (Copy)`,
                type: template.type,
                country: template.country,
                htmlContent: template.htmlContent,
                variables: template.variables,
            }
            const response = await offersApi.createTemplate(data)
            if (response.success && response.data) {
                setTemplates(prev => [response.data!, ...prev])
                toast.success('Template duplicated')
            }
        } catch (err: any) {
            toast.error('Failed to duplicate template')
        }
    }

    const filtered = templates.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-muted/40 rounded-lg animate-pulse" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                <Dialog open={isCreateOpen} onOpenChange={(open) => {
                    if (!open) resetForm()
                    setIsCreateOpen(open)
                }}>
                    <DialogTrigger asChild>
                        <Button className="gap-2 h-9">
                            <Plus className="h-4 w-4" />
                            New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>
                                {editingTemplate ? 'Edit Template' : 'Create Offer Template'}
                            </DialogTitle>
                            <DialogDescription>
                                Use <code className="text-xs bg-muted px-1 py-0.5 rounded">{'{{variableName}}'}</code> syntax for dynamic fields that get filled when creating an offer.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Template Name</Label>
                                <Input
                                    placeholder="e.g. Software Engineer Offer Letter"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Employment Type</Label>
                                <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                                        <SelectItem value="INTERN">Intern</SelectItem>
                                        <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Country (Optional)</Label>
                                <Input
                                    placeholder="e.g. US, UK, IN"
                                    value={formCountry}
                                    onChange={(e) => setFormCountry(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Template HTML Content</Label>
                                <Textarea
                                    placeholder={`Dear {{candidateName}},\n\nWe are pleased to offer you the position of {{position}} at {{companyName}}...\n\nSalary: {{salary}}\nStart Date: {{startDate}}\n\nBest regards,\n{{signerName}}`}
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    className="min-h-[300px] font-mono text-sm"
                                />
                            </div>

                            {/* Live variable detection */}
                            {formContent && (() => {
                                const vars = [...new Set((formContent.match(/\{\{(\w+)\}\}/g) || []).map(v => v.replace(/\{\{|\}\}/g, '')))]
                                if (vars.length === 0) return null
                                return (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">
                                            <Braces className="w-3 h-3 inline mr-1" />
                                            Detected Variables ({vars.length})
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {vars.map(v => (
                                                <Badge key={v} variant="secondary" className="text-xs font-mono">
                                                    {v}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={formSaving}>
                                {formSaving ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Empty State */}
            {templates.length === 0 && (
                <div className="p-12 text-center border rounded-lg bg-muted/10 border-dashed">
                    <LayoutTemplate className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No templates yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-md mx-auto">
                        Create your first offer letter template to streamline the hiring process.
                    </p>
                    <Button className="mt-4 gap-2" onClick={() => setIsCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Create Template
                    </Button>
                </div>
            )}

            {/* Template Cards */}
            {filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((template) => {
                        const variables = template.variables || []
                        return (
                            <Card key={template._id} className="group hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-sm font-medium truncate">
                                                    {template.name}
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground">
                                                    {format(new Date(template.createdAt), 'MMM d, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={template.isActive
                                                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-gray-100 text-gray-500 border-gray-200"
                                            }
                                        >
                                            {template.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    {/* Content preview */}
                                    <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                                        {template.htmlContent.slice(0, 150)}
                                        {template.htmlContent.length > 150 && '...'}
                                    </p>

                                    {/* Attributes */}
                                    <div className="flex gap-2 mb-3">
                                        <Badge variant="outline" className="text-[10px]">{template.type.replace('_', ' ')}</Badge>
                                        {template.country && <Badge variant="outline" className="text-[10px]">{template.country}</Badge>}
                                    </div>

                                    {/* Variables */}
                                    {variables.length > 0 && (
                                        <div className="mb-3">
                                            <div className="flex flex-wrap gap-1">
                                                {variables.slice(0, 4).map(v => (
                                                    <Badge key={v} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                                                        {v}
                                                    </Badge>
                                                ))}
                                                {variables.length > 4 && (
                                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                        +{variables.length - 4} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs gap-1 flex-1"
                                            onClick={() => openPreview(template)}
                                        >
                                            <Eye className="w-3 h-3" />
                                            Preview
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs gap-1 flex-1"
                                            onClick={() => openEdit(template)}
                                        >
                                            <Edit2 className="w-3 h-3" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs gap-1 flex-1"
                                            onClick={() => duplicateTemplate(template)}
                                        >
                                            <Copy className="w-3 h-3" />
                                            Duplicate
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{previewTemplate?.name}</DialogTitle>
                        <DialogDescription>
                            Template preview — variables shown as placeholders
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="p-6 bg-white dark:bg-muted/20 border rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                                {previewTemplate?.htmlContent}
                            </pre>
                        </div>
                        {previewTemplate && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                    Variables in this template
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(previewTemplate.variables || []).map(v => (
                                        <Badge key={v} variant="secondary" className="text-xs font-mono">
                                            {'{{' + v + '}}'}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
                        <Button onClick={() => {
                            setIsPreviewOpen(false)
                            if (previewTemplate) openEdit(previewTemplate)
                        }}>
                            Edit Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
