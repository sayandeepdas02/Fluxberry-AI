import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle, Clock } from 'lucide-react'
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
import { interviewsApi, IInterview } from '@/lib/api/interviews'
import { toast } from 'sonner'
import { format, isPast } from 'date-fns'

export function InterviewList() {
    const [interviews, setInterviews] = useState<IInterview[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadInterviews()
    }, [])

    const loadInterviews = async () => {
        try {
            const response = await interviewsApi.list()
            if (response.success && response.data) {
                setInterviews(response.data)
            }
        } catch (error) {
            toast.error('Failed to load interviews')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Interviews</h2>
                    <p className="text-muted-foreground">
                        Schedule and manage candidate interviews.
                    </p>
                </div>
                <Link href="/dashboard/interviews/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Interview
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upcoming & Recent</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Feedback</TableHead>
                                <TableHead className="w-[100px]">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interviews.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No interviews scheduled.
                                    </TableCell>
                                </TableRow>
                            )}
                            {interviews.map((interview) => (
                                <TableRow key={interview._id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">
                                                {format(new Date(interview.start), 'MMM d, yyyy')}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(interview.start), 'h:mm a')} - {format(new Date(interview.end), 'h:mm a')}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* Ideally we fetch name, or if populated */}
                                        {/* For now assuming backend might populate or we use IDs if not */}
                                        <span className="font-medium">{interview.candidateId}</span>
                                        {/* TODO: Populate candidate/job details on backend or fetch here */}
                                    </TableCell>
                                    <TableCell>{interview.summary}</TableCell>
                                    <TableCell>
                                        <Badge variant={interview.status === 'COMPLETED' ? 'default' : 'outline'}>
                                            {interview.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {interview.feedbackSubmitted ? (
                                            <div className="flex items-center text-green-600 text-sm">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Submitted
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-muted-foreground text-sm">
                                                <Clock className="w-4 h-4 mr-1" /> Pending
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {/* Link to Scorecard */}
                                            <Link href={`/dashboard/interviews/${interview._id}/scorecard`}>
                                                <Button variant="outline" size="sm">
                                                    Scorecard
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/interviews/${interview._id}`}>
                                                <Button variant="ghost" size="sm">
                                                    Edit
                                                </Button>
                                            </Link>
                                        </div>
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
