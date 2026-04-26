"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Copy, Check, ExternalLink, Briefcase, FileText } from "lucide-react"
import Link from "next/link"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function JobsList() {
    const [jobs, setJobs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        fetch("/api/jobs")
            .then(async res => {
                if (!res.ok) {
                    const text = await res.text()
                    throw new Error(text || `Error ${res.status}`)
                }
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setJobs(data)
                } else {
                    setJobs([])
                }
                setLoading(false)
            })
            .catch(err => {
                console.error("Jobs fetch error:", err)
                setLoading(false)
            })
    }, [])

    const copyLink = (job: any) => {
        const url = `${window.location.origin}/apply/${job.shareableLink}`
        navigator.clipboard.writeText(url)
        setCopiedId(job.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[16px] border border-slate-200 shadow-sm">
                <div className="animate-spin h-8 w-8 border-[3px] border-primary border-t-transparent rounded-full" />
                <span className="mt-4 text-[14px] font-medium text-slate-500">Loading your jobs...</span>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/80">
                        <TableRow className="hover:bg-transparent border-slate-200">
                            <TableHead className="font-semibold text-slate-600 h-12">Job Role</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-12">Type & Location</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-12">Status</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-12 text-center">Candidates</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-12">Posted</TableHead>
                            <TableHead className="font-semibold text-slate-600 h-12">Apply Link</TableHead>
                            <TableHead className="w-[50px] h-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map((job) => (
                            <TableRow key={job.id} className="hover:bg-slate-50/80 transition-colors border-slate-100 group">
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-[10px] bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                            <Briefcase className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-[15px] text-slate-900 leading-tight">{job.title}</span>
                                            <span className="text-[13px] text-slate-500">{job.experienceLevel}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[14px] font-medium text-slate-700">{job.roleType}</span>
                                        <span className="text-[13px] text-slate-500">{job.location}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            "border-0 px-2.5 py-1 text-[12px] font-semibold tracking-wide uppercase",
                                            job.status === "published" 
                                                ? "bg-emerald-50 text-emerald-600" 
                                                : "bg-slate-100 text-slate-500"
                                        )}
                                    >
                                        {job.status === "published" ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
                                            </span>
                                        ) : "Draft"}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-slate-50 border border-slate-200 text-[13px] font-bold text-slate-700">
                                        {job._count?.candidates ?? 0}
                                    </div>
                                </TableCell>
                                <TableCell className="text-[14px] text-slate-500 font-medium">
                                    {new Date(job.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </TableCell>
                                <TableCell>
                                    {job.status === "published" && job.shareableLink ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-8 rounded-full text-[12px] gap-1.5 font-semibold transition-all shadow-sm",
                                                copiedId === job.id 
                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-600" 
                                                    : "bg-white text-slate-700 hover:border-slate-300"
                                            )}
                                            onClick={() => copyLink(job)}
                                        >
                                            {copiedId === job.id
                                                ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!</>
                                                : <><Copy className="h-3.5 w-3.5 text-slate-400" /> Copy Link</>
                                            }
                                        </Button>
                                    ) : (
                                        <span className="text-[13px] text-slate-400 italic">Not available</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-slate-200/50 text-slate-400 group-hover:text-slate-600">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-[12px] p-1.5 shadow-xl">
                                            <DropdownMenuItem asChild className="rounded-[8px] cursor-pointer">
                                                <Link href={`/dashboard/jobs/${job.id}`} className="flex items-center">
                                                    <FileText className="h-4 w-4 mr-2 text-slate-400" /> View Details
                                                </Link>
                                            </DropdownMenuItem>
                                            {job.status === "published" && job.shareableLink && (
                                                <DropdownMenuItem asChild className="rounded-[8px] cursor-pointer">
                                                    <a href={`/apply/${job.shareableLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                                        <ExternalLink className="h-4 w-4 mr-2 text-slate-400" /> Preview Post
                                                    </a>
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {jobs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="h-[300px] text-center">
                                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                            <Briefcase className="h-8 w-8 text-slate-300" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-900 mb-1">No jobs posted yet</h3>
                                        <p className="text-[14px] text-slate-500 mb-6">Create your first job to start accepting applications and screening candidates automatically.</p>
                                        <Link href="/dashboard/jobs/new">
                                            <Button className="rounded-full px-6 shadow-sm">Create New Job</Button>
                                        </Link>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
