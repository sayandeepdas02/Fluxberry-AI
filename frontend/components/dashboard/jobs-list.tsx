"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Plus } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function JobsList() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/jobs")
            .then(res => res.json())
            .then(data => {
                setJobs(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div>Loading jobs...</div>

    return (
        <div className="space-y-4">
            {/* Header handled externally by SectionHeader */}

            <div className="bg-card rounded-[12px] border shadow-sm overflow-hidden mix-blend-multiply">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Role Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Candidates</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id}>
                                <TableCell className="font-medium">{job.title}</TableCell>
                                <TableCell>{job.roleType}</TableCell>
                                <TableCell>
                                    <Badge variant={job.status === "published" ? "default" : "secondary"}>
                                        {job.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>{job._count?.candidates || 0}</TableCell>
                                <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Link href={`/dashboard/jobs/${job.id}`}>View Details</Link>
                                            </DropdownMenuItem>
                                            {job.status === "published" && (
                                                <DropdownMenuItem onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/apply/${job.shareableLink}`)
                                                    alert("Link copied!")
                                                }}>
                                                    Copy Apply Link
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {jobs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No jobs found. Create your first job to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
