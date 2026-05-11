import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Calendar as CalendarIcon, Save, ArrowLeft, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { interviewsApi, InterviewFormData } from '@/lib/api/interviews'
import { candidatesApi, Candidate } from '@/lib/api/candidates'
import { jobsApi, Job } from '@/lib/api/jobs'
import { organizationsApi, OrganizationMember } from '@/lib/api/organizations'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function InterviewScheduler() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : undefined
    const isNew = !id || id === 'new'

    const [loading, setLoading] = useState(false)
    const [candidates, setCandidates] = useState<Candidate[]>([])
    const [jobs, setJobs] = useState<Job[]>([])
    const [interviewers, setInterviewers] = useState<OrganizationMember[]>([])

    // Form State
    const [formData, setFormData] = useState<InterviewFormData>({
        title: '',
        attendees: [],
        status: 'SCHEDULED'
    })

    // UI Helpers for datetime input (native datetime-local uses YYYY-MM-DDTHH:mm)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        Promise.all([
            loadCandidates(),
            loadJobs(),
            loadInterviewers(),
            !isNew && id ? loadInterview(id) : Promise.resolve()
        ])
    }, [id])

    const loadCandidates = async () => {
        const res = await candidatesApi.list({ limit: 100 })
        if (res.success && res.data) setCandidates(res.data)
    }

    const loadJobs = async () => {
        const res = await jobsApi.list()
        if (res.success && res.data) setJobs(res.data)
    }

    const loadInterviewers = async () => {
        const res = await organizationsApi.getCurrentMembers()
        if (res.success && res.data) setInterviewers(res.data)
    }

    const loadInterview = async (interviewId: string) => {
        setLoading(true)
        try {
            const res = await interviewsApi.getById(interviewId)
            if (res.success && res.data) {
                const d = res.data
                setFormData({
                    candidateId: d.candidateId._id,
                    interviewerId: d.interviewerId._id,
                    jobId: d.jobId._id,
                    applicationId: d.applicationId,
                    title: d.title,
                    description: d.description,
                    type: d.type,
                    status: d.status,
                    meetingLink: d.meetingLink,
                    location: d.location,
                    attendees: d.attendees,
                })
                setStartDate(format(new Date(d.startTime), "yyyy-MM-dd'T'HH:mm"))
                setEndDate(format(new Date(d.endTime), "yyyy-MM-dd'T'HH:mm"))
            }
        } catch (error) {
            toast.error('Failed to load interview')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formData.candidateId || !formData.jobId || !startDate || !endDate) {
            return toast.error('Please fill in all required fields')
        }

        setLoading(true)
        const payload = {
            ...formData,
            startTime: new Date(startDate).toISOString(),
            endTime: new Date(endDate).toISOString(),
        }

        try {
            if (isNew) {
                // Runtime guard above ensures required fields are present
                await interviewsApi.create(payload as Parameters<typeof interviewsApi.create>[0])
                toast.success('Interview scheduled')
            } else if (id) {
                await interviewsApi.update(id, payload)
                toast.success('Interview updated')
            }
            router.push('/dashboard/interviews')
        } catch (error) {
            toast.error('Failed to save interview')
        } finally {
            setLoading(false)
        }
    }

    // Handle multi-select for attendees (stored as member _id strings)
    const toggleAttendee = (memberId: string) => {
        const current = formData.attendees || []
        if (current.includes(memberId)) {
            setFormData({ ...formData, attendees: current.filter(id => id !== memberId) })
        } else {
            setFormData({ ...formData, attendees: [...current, memberId] })
        }
    }

    if (loading && !isNew) return <div>Loading...</div>

    return (
        <div className="space-y-6 max-w-3xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/interviews')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl tracking-tight">
                    {isNew ? 'Schedule Interview' : 'Edit Interview'}
                </h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Candidate</Label>
                            <Select
                                value={formData.candidateId}
                                onValueChange={(val) => setFormData({ ...formData, candidateId: val })}
                                disabled={!isNew}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Candidate" />
                                </SelectTrigger>
                                <SelectContent>
                                    {candidates.map(c => (
                                        <SelectItem key={c._id} value={c._id}>
                                            {c.firstName} {c.lastName} ({c.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Job</Label>
                            <Select
                                value={formData.jobId}
                                onValueChange={(val) => setFormData({ ...formData, jobId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Job" />
                                </SelectTrigger>
                                <SelectContent>
                                    {jobs.map(j => (
                                        <SelectItem key={j._id} value={j._id}>
                                            {j.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Interview Summary/Title</Label>
                        <Input
                            value={formData.title || ''}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Technical Screen with John"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Start Time</Label>
                            <Input
                                type="datetime-local"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>End Time</Label>
                            <Input
                                type="datetime-local"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Interviewers (Attendees)</Label>
                        <div className="grid grid-cols-2 gap-2 border p-4 rounded-md h-40 overflow-y-auto">
                            {interviewers.map(member => (
                                <div key={member._id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={member._id}
                                        checked={formData.attendees?.includes(member._id) ?? false}
                                        onCheckedChange={() => toggleAttendee(member._id)}
                                    />
                                    <Label htmlFor={member._id}>{member.firstName} {member.lastName}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Meeting Link (Optional)</Label>
                        <Input
                            value={formData.meetingLink || ''}
                            onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                            placeholder="https://meet.google.com/..."
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading} size="lg">
                    {loading ? 'Scheduling...' : 'Schedule Interview'}
                </Button>
            </div>
        </div>
    )
}
