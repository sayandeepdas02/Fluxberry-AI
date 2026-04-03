import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, ArrowLeft, Info, Send, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { emailTemplatesApi, IEmailTemplate } from '@/lib/api/email-templates'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'

const AVAILABLE_VARIABLES = [
    'candidate.firstName',
    'candidate.lastName',
    'candidate.email',
    'job.title',
    'job.companyName',
    'application.status',
    'link.portal'
]

export function EmailEditor() {
    const params = useParams()
    const router = useRouter()
    // Handle generic params type or safely access id
    const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined
    const isNew = !id || id === 'new'

    const [loading, setLoading] = useState(false)
    const [sendDialogOpen, setSendDialogOpen] = useState(false)
    const [sendTo, setSendTo] = useState('')
    const [sending, setSending] = useState(false)
    const [template, setTemplate] = useState<Partial<IEmailTemplate>>({
        name: '',
        subject: '',
        content: '',
        isActive: true,
        variables: []
    })

    useEffect(() => {
        if (!isNew && id) {
            loadTemplate(id)
        }
    }, [id])

    const loadTemplate = async (templateId: string) => {
        setLoading(true)
        try {
            const response = await emailTemplatesApi.getById(templateId)
            if (response.success && response.data) {
                setTemplate(response.data)
            } else {
                toast.error('Failed to load template')
                router.push('/dashboard/settings/email-templates')
            }
        } catch (error) {
            toast.error('Failed to load template')
            router.push('/dashboard/settings/email-templates')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!template.name) return toast.error('Name is required')
        if (!template.subject) return toast.error('Subject is required')
        if (!template.content) return toast.error('Content is required')

        setLoading(true)
        try {
            if (isNew) {
                await emailTemplatesApi.create(template)
                toast.success('Template created')
            } else if (id) {
                await emailTemplatesApi.update(id, template)
                toast.success('Template updated')
            }
            router.push('/dashboard/settings/email-templates')
        } catch (error) {
            toast.error('Failed to save template')
        } finally {
            setLoading(false)
        }
    }

    const handleSendTest = async () => {
        if (!id || isNew) return toast.error('Save the template before sending a test')
        if (!sendTo.trim()) return toast.error('Please enter a recipient email')

        setSending(true)
        try {
            const res = await emailTemplatesApi.send(id, { to: sendTo.trim() })
            if (res.success) {
                toast.success(res.data?.preview || `Test email sent to ${sendTo}`)
                setSendDialogOpen(false)
                setSendTo('')
            } else {
                toast.error('Failed to send test email')
            }
        } catch {
            toast.error('Failed to send test email')
        } finally {
            setSending(false)
        }
    }

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const text = template.content || ''
        const before = text.substring(0, start)
        const after = text.substring(end, text.length)
        const newText = before + `{{${variable}}}` + after

        setTemplate({ ...template, content: newText })

        // Restore focus/cursor (requires timeout in React)
        setTimeout(() => {
            textarea.focus()
            textarea.selectionStart = textarea.selectionEnd = start + variable.length + 4
        }, 0)
    }

    if (loading && !isNew) return <div>Loading...</div>

    return (
        <>
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/settings/email-templates')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl tracking-tight">
                        {isNew ? 'Create Template' : 'Edit Template'}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Template Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    value={template.name}
                                    onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                                    placeholder="e.g. Interview Invitation"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subject">Email Subject</Label>
                                <Input
                                    id="subject"
                                    value={template.subject}
                                    onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                                    placeholder="e.g. Invitation to Interview at {{job.companyName}}"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 flex flex-col">
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                            <CardDescription>
                                Supports standard HTML and Handlebars syntax.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <Textarea
                                id="content-editor"
                                className="min-h-[400px] text-sm leading-relaxed"
                                value={template.content}
                                onChange={(e) => setTemplate({ ...template, content: e.target.value })}
                                placeholder="<html>...</html>"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Variables</CardTitle>
                            <CardDescription>Click to insert</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_VARIABLES.map((v) => (
                                    <Badge
                                        key={v}
                                        variant="outline"
                                        className="cursor-pointer hover:bg-muted"
                                        onClick={() => insertVariable(v)}
                                    >
                                        {v}
                                    </Badge>
                                ))}
                            </div>
                            <div className="mt-4 text-xs text-muted-foreground flex gap-2">
                                <Info className="h-4 w-4" />
                                <p>
                                    Variables are replaced with actual data when sending.
                                    Use <code>{`{{variable}}`}</code> syntax.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Preview & Send</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => setSendDialogOpen(true)}
                                disabled={isNew || loading}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                Send Test Email
                            </Button>
                            {isNew && (
                                <p className="text-xs text-muted-foreground text-center">
                                    Save the template first to enable sending.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Button onClick={handleSave} disabled={loading} size="lg" className="w-full">
                        {loading ? 'Saving...' : 'Save Template'}
                    </Button>
                </div>
            </div>

        {/* Send Test Email Dialog */}
        <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Send Test Email</DialogTitle>
                    <DialogDescription>
                        Send a test version of <span className="font-medium text-foreground">{template.name || 'this template'}</span> to verify it looks correct.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2">
                    <Label htmlFor="send-to">Recipient email</Label>
                    <div className="relative mt-1.5">
                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="send-to"
                            type="email"
                            placeholder="you@example.com"
                            className="pl-9"
                            value={sendTo}
                            onChange={(e) => setSendTo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendTest()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSendTest} disabled={sending || !sendTo.trim()}>
                        {sending ? 'Sending...' : <><Send className="mr-2 h-4 w-4" />Send</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
    )
}
