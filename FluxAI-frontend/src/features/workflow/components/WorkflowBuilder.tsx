import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash, Save, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { workflowsApi } from '@/lib/api/workflows'
import {
    IWorkflowRule,
    WorkflowTrigger,
    ConditionOperator,
    ActionType,
    IWorkflowCondition,
    IWorkflowAction,
} from '../types'
import { toast } from 'sonner'
import { jobsApi, Job } from '@/lib/api/jobs'
import { pipelineApi } from '@/lib/api/pipeline'
import { PipelineStage } from '@/lib/api/types'

export function WorkflowBuilder() {
    const params = useParams()
    const router = useRouter()
    // Handle generic params type or safely access id
    const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined
    const isNew = !id || id === 'new'

    const [loading, setLoading] = useState(false)
    const [rule, setRule] = useState<Partial<IWorkflowRule>>({
        name: '',
        isActive: true,
        trigger: WorkflowTrigger.STAGE_CHANGED,
        conditions: [],
        actions: [],
    })

    const [jobs, setJobs] = useState<Job[]>([])
    const [stages, setStages] = useState<PipelineStage[]>([])

    // Derived state: find selected job ID from conditions
    const selectedJobId = rule.conditions?.find(c => c.field === 'jobId' && c.operator === 'EQUALS')?.value

    useEffect(() => {
        loadJobs()
    }, [])

    useEffect(() => {
        if (selectedJobId) {
            loadStages(selectedJobId)
        } else {
            setStages([])
        }
    }, [selectedJobId])

    const loadJobs = async () => {
        try {
            const response = await jobsApi.list()
            if (response.success && response.data) {
                setJobs(response.data.jobs)
            }
        } catch (error) {
            toast.error('Failed to load jobs')
        }
    }

    const loadStages = async (jobId: string) => {
        try {
            const response = await pipelineApi.getStages(jobId)
            if (response.success && response.data) {
                setStages(response.data)
            }
        } catch (error) {
            toast.error('Failed to load stages')
        }
    }

    useEffect(() => {
        if (!isNew && id) {
            loadRule(id)
        }
    }, [id])

    const loadRule = async (ruleId: string) => {
        setLoading(true)
        try {
            const response = await workflowsApi.getById(ruleId)
            if (response.success && response.data) {
                setRule(response.data)
            } else {
                toast.error('Failed to load workflow')
                router.push('/dashboard/workflows')
            }
        } catch (error) {
            toast.error('Failed to load workflow')
            router.push('/dashboard/workflows')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!rule.name) return toast.error('Name is required')
        if (!rule.trigger) return toast.error('Trigger is required')

        setLoading(true)
        try {
            if (isNew) {
                await workflowsApi.create(rule)
                toast.success('Workflow created')
            } else if (id) {
                await workflowsApi.update(id, rule)
                toast.success('Workflow updated')
            }
            router.push('/dashboard/workflows')
        } catch (error) {
            toast.error('Failed to save workflow')
        } finally {
            setLoading(false)
        }
    }

    const addCondition = () => {
        setRule({
            ...rule,
            conditions: [
                ...(rule.conditions || []),
                { field: 'newStageId', operator: ConditionOperator.EQUALS, value: '' },
            ],
        })
    }

    const updateCondition = (index: number, field: keyof IWorkflowCondition, value: string) => {
        const newConditions = [...(rule.conditions || [])]
        newConditions[index] = { ...newConditions[index], [field]: value }
        setRule({ ...rule, conditions: newConditions })
    }

    const removeCondition = (index: number) => {
        const newConditions = [...(rule.conditions || [])]
        newConditions.splice(index, 1)
        setRule({ ...rule, conditions: newConditions })
    }

    const addAction = () => {
        setRule({
            ...rule,
            actions: [
                ...(rule.actions || []),
                { type: ActionType.SEND_EMAIL, config: {} },
            ],
        })
    }

    const updateActionType = (index: number, type: ActionType) => {
        const newActions = [...(rule.actions || [])]
        newActions[index] = { type, config: {} } // Reset config on type change
        setRule({ ...rule, actions: newActions })
    }

    const updateActionConfig = (index: number, key: string, value: string) => {
        const newActions = [...(rule.actions || [])]
        newActions[index] = {
            ...newActions[index],
            config: { ...newActions[index].config, [key]: value },
        }
        setRule({ ...rule, actions: newActions })
    }

    const removeAction = (index: number) => {
        const newActions = [...(rule.actions || [])]
        newActions.splice(index, 1)
        setRule({ ...rule, actions: newActions })
    }

    if (loading && !isNew) return <div>Loading...</div>

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/workflows')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl tracking-tight">
                        {isNew ? 'Create Workflow' : 'Edit Workflow'}
                    </h2>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Workflow Name</Label>
                        <Input
                            id="name"
                            value={rule.name}
                            onChange={(e) => setRule({ ...rule, name: e.target.value })}
                            placeholder="e.g. Send email on screening"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch
                            id="active"
                            checked={rule.isActive}
                            onCheckedChange={(checked) => setRule({ ...rule, isActive: checked })}
                        />
                        <Label htmlFor="active">Active</Label>
                    </div>
                    <div className="grid gap-2">
                        <Label>Trigger Event</Label>
                        <Select
                            value={rule.trigger}
                            onValueChange={(val) =>
                                setRule({ ...rule, trigger: val as WorkflowTrigger })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(WorkflowTrigger).map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t.replace('_', ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Conditions (AND)</CardTitle>
                    <Button variant="outline" size="sm" onClick={addCondition}>
                        <Plus className="mr-2 h-4 w-4" /> Add Condition
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rule.conditions?.length === 0 && (
                        <p className="text-sm text-muted-foreground">No conditions set.</p>
                    )}
                    {rule.conditions?.map((condition, index) => (
                        <div key={index} className="flex gap-2 items-end border p-4 rounded-md">
                            <div className="grid gap-2 flex-1">
                                <Label>Field</Label>
                                <Select
                                    value={condition.field}
                                    onValueChange={(val) => updateCondition(index, 'field', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="newStageId">New Stage ID</SelectItem>
                                        <SelectItem value="previousStageId">Previous Stage ID</SelectItem>
                                        <SelectItem value="jobId">Job ID</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2 w-[150px]">
                                <Label>Operator</Label>
                                <Select
                                    value={condition.operator}
                                    onValueChange={(val) =>
                                        updateCondition(index, 'operator', val as ConditionOperator)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.values(ConditionOperator).map((op) => (
                                            <SelectItem key={op} value={op}>
                                                {op}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2 flex-1">
                                <Label>Value</Label>
                                {condition.field === 'jobId' ? (
                                    <Select
                                        value={condition.value}
                                        onValueChange={(val) => updateCondition(index, 'value', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Job" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {jobs.map((job) => (
                                                <SelectItem key={job._id} value={job._id}>
                                                    {job.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (condition.field === 'newStageId' || condition.field === 'previousStageId') ? (
                                    <Select
                                        value={condition.value}
                                        onValueChange={(val) => updateCondition(index, 'value', val)}
                                        disabled={!selectedJobId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={selectedJobId ? "Select Stage" : "Select Job first"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {stages.map((stage) => (
                                                <SelectItem key={stage._id} value={stage._id}>
                                                    {stage.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        value={condition.value}
                                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                                        placeholder="Value to match"
                                    />
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => removeCondition(index)}
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Actions</CardTitle>
                    <Button variant="outline" size="sm" onClick={addAction}>
                        <Plus className="mr-2 h-4 w-4" /> Add Action
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {rule.actions?.length === 0 && (
                        <p className="text-sm text-muted-foreground">No actions set.</p>
                    )}
                    {rule.actions?.map((action, index) => (
                        <div key={index} className="border p-4 rounded-md space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="grid gap-2 w-[200px]">
                                    <Label>Action Type</Label>
                                    <Select
                                        value={action.type}
                                        onValueChange={(val) =>
                                            updateActionType(index, val as ActionType)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(ActionType).map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {t.replace('_', ' ')}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive"
                                    onClick={() => removeAction(index)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Dynamic Config Fields based on Action Type */}
                            {action.type === ActionType.SEND_EMAIL && (
                                <div className="grid gap-2">
                                    <Label>Template ID (Optional)</Label>
                                    <Input
                                        value={action.config.templateId || ''}
                                        onChange={(e) =>
                                            updateActionConfig(index, 'templateId', e.target.value)
                                        }
                                        placeholder="Email Template ID"
                                    />
                                    <Label>Subject (Override)</Label>
                                    <Input
                                        value={action.config.subject || ''}
                                        onChange={(e) =>
                                            updateActionConfig(index, 'subject', e.target.value)
                                        }
                                        placeholder="Email Subject"
                                    />
                                </div>
                            )}

                            {action.type === ActionType.ADD_TAG && (
                                <div className="grid gap-2">
                                    <Label>Tag Name</Label>
                                    <Input
                                        value={action.config.tag || ''}
                                        onChange={(e) =>
                                            updateActionConfig(index, 'tag', e.target.value)
                                        }
                                        placeholder="Tag to add"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? 'Saving...' : 'Save Workflow'}
                </Button>
            </div>
        </div>
    )
}
