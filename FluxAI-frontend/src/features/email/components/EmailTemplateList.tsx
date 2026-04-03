import React, { useEffect, useState } from 'react'
import { Plus, Trash, Edit, Search } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { emailTemplatesApi, IEmailTemplate } from '@/lib/api/email-templates'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

export function EmailTemplateList() {
    const [templates, setTemplates] = useState<IEmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        loadTemplates()
    }, [])

    const loadTemplates = async () => {
        try {
            const response = await emailTemplatesApi.list()
            if (response.success && response.data) {
                setTemplates(response.data)
            }
        } catch (error) {
            toast.error('Failed to load templates')
        } finally {
            setLoading(false)
        }
    }

    const deleteTemplate = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return
        try {
            await emailTemplatesApi.delete(id)
            setTemplates(templates.filter((t) => t._id !== id))
            toast.success('Template deleted')
        } catch (error) {
            toast.error('Failed to delete template')
        }
    }

    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-56" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="border rounded-lg overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <Skeleton className="h-6 w-28" />
                    <Skeleton className="h-9 w-52" />
                </div>
                <div className="divide-y">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4">
                            <Skeleton className="h-4 w-40 flex-1" />
                            <Skeleton className="h-4 w-64 flex-1" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl tracking-tight">Email Templates</h2>
                    <p className="text-muted-foreground">
                        Manage your email templates for automated workflows and messaging.
                    </p>
                </div>
                <Link href="/dashboard/settings/email-templates/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Template
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Templates</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search templates..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Last Updated</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTemplates.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No templates found.
                                    </TableCell>
                                </TableRow>
                            )}
                            {filteredTemplates.map((template) => (
                                <TableRow key={template._id}>
                                    <TableCell className="font-medium">{template.name}</TableCell>
                                    <TableCell>{template.subject}</TableCell>
                                    <TableCell>
                                        {format(new Date(template.updatedAt), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <Link href={`/dashboard/settings/email-templates/${template._id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => deleteTemplate(template._id)}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
