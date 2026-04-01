import React, { useEffect, useState } from 'react'
import { Plus, Trash, Edit, Play, Pause } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { workflowsApi } from '@/lib/api/workflows'
import { IWorkflowRule, WorkflowTrigger } from '../types'
import { toast } from 'sonner'

export function WorkflowList() {
    const [rules, setRules] = useState<IWorkflowRule[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadRules()
    }, [])

    const loadRules = async () => {
        try {
            const response = await workflowsApi.list()
            if (response.success && response.data) {
                setRules(response.data)
            }
        } catch (error) {
            toast.error('Failed to load workflows')
        } finally {
            setLoading(false)
        }
    }

    const toggleStatus = async (rule: IWorkflowRule) => {
        try {
            const response = await workflowsApi.update(rule._id, { isActive: !rule.isActive })
            if (response.success && response.data) {
                const updatedRule = response.data
                setRules(rules.map((r) => (r._id === rule._id ? updatedRule : r)))
                toast.success(`Workflow ${updatedRule.isActive ? 'activated' : 'deactivated'}`)
            } else {
                throw new Error("API call unsuccessful")
            }
        } catch (error) {
            toast.error('Failed to update status')
        }
    }

    const deleteRule = async (id: string) => {
        if (!confirm('Are you sure you want to delete this workflow?')) return
        try {
            await workflowsApi.delete(id)
            setRules(rules.filter((r) => r._id !== id))
            toast.success('Workflow deleted')
        } catch (error) {
            toast.error('Failed to delete workflow')
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl tracking-tight">Workflows</h2>
                    <p className="text-muted-foreground">
                        Automate your hiring process with custom rules.
                    </p>
                </div>
                <Link href="/dashboard/workflows/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workflow
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Rules</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Trigger</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rules.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No workflows created yet.
                                    </TableCell>
                                </TableRow>
                            )}
                            {rules.map((rule) => (
                                <TableRow key={rule._id}>
                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{rule.trigger}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                                            {rule.isActive ? 'Active' : 'Paused'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleStatus(rule)}
                                        >
                                            {rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                        </Button>
                                        <Link href={`/dashboard/workflows/${rule._id}`}>
                                            <Button variant="ghost" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => deleteRule(rule._id)}
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
