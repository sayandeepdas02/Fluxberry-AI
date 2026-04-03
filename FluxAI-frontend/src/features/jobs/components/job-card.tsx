'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { MoreVertical, Copy, ExternalLink, Pencil, X, Rocket, Trash2 } from 'lucide-react'
import type { Job } from '@/lib/api/jobs'
import { useRBAC } from '@/lib/hooks/use-rbac'

interface JobCardProps {
    job: Job
    onPublish?: (id: string) => void
    onClose?: (id: string) => void
    onDelete?: (id: string) => void
    onEdit?: (id: string) => void
    onClick?: (id: string) => void
}

const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', variant: 'outline' as const, className: 'border-muted-foreground/30 text-muted-foreground' },
    PUBLISHED: { label: 'Published', variant: 'default' as const, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
    CLOSED: { label: 'Closed', variant: 'secondary' as const, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
}

export function JobCard({ job, onPublish, onClose, onDelete, onEdit, onClick }: JobCardProps) {
    const [menuOpen, setMenuOpen] = React.useState(false)
    const menuRef = React.useRef<HTMLDivElement>(null)
    const { can } = useRBAC()

    const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.DRAFT

    // Close menu on click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    const handleCopyLink = () => {
        if (job.publicSlug) {
            const url = `${window.location.origin}/jobs/${job.publicSlug}`
            navigator.clipboard.writeText(url)
        }
        setMenuOpen(false)
    }

    return (
        <div
            className="group border border-line rounded-none p-5 bg-background hover:bg-muted/10 hover:border-foreground/30 transition-all cursor-pointer"
            onClick={() => onClick?.(job._id)}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Left: Job Details */}
                <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-3">
                        <h3 className="text-base font-medium text-foreground truncate">
                            {job.title}
                        </h3>
                        <Badge variant={statusConfig.variant} className={`text-[10px] px-2 py-0.5 font-medium ${statusConfig.className}`}>
                            {statusConfig.label}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {job.department && <span>{job.department}</span>}
                        {job.location && <span>· {job.location}</span>}
                        {job.employmentType && (
                            <span>· {job.employmentType.replace(/_/g, ' ')}</span>
                        )}
                    </div>

                    {/* Skills & Requirements */}
                    {(job.requiredSkills && job.requiredSkills.length > 0) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {job.requiredSkills.slice(0, 4).map((skill, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] px-2 py-0.5 rounded-none bg-muted/40 text-muted-foreground border border-line"
                                >
                                    {skill}
                                </span>
                            ))}
                            {job.requiredSkills.length > 4 && (
                                <span className="text-[10px] text-muted-foreground/50">
                                    +{job.requiredSkills.length - 4} more
                                </span>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground/60 pt-1">
                        <span>{job.applicationCount ?? 0} applications</span>
                        {job.publishedAt && (
                            <span>Published {new Date(job.publishedAt).toLocaleDateString()}</span>
                        )}
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setMenuOpen(!menuOpen)
                        }}
                        className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-8 z-50 w-48 bg-background border border-line rounded-none shadow-none py-1 animate-in fade-in-0 zoom-in-95">
                            {can('edit_jobs') && (
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit?.(job._id)
                                    setMenuOpen(false)
                                }}
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                            </button>
                            )}

                            {job.status === 'DRAFT' && can('publish_jobs') && (

                                <button
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-emerald-500 hover:bg-muted/50 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onPublish?.(job._id)
                                        setMenuOpen(false)
                                    }}
                                >
                                    <Rocket className="w-3.5 h-3.5" />
                                    Publish
                                </button>
                            )}

                            {job.status === 'PUBLISHED' && (
                                <>
                                    <button
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleCopyLink()
                                        }}
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Public Link
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            if (job.publicSlug) {
                                                window.open(`/jobs/${job.publicSlug}`, '_blank')
                                            }
                                            setMenuOpen(false)
                                        }}
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        View Public Page
                                    </button>
                                    {can('manage_jobs') && (
                                    <button
                                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-orange-500 hover:bg-muted/50 transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onClose?.(job._id)
                                            setMenuOpen(false)
                                        }}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Close Job
                                    </button>
                                    )}
                                </>
                            )}

                            <div className="border-t border-line my-1" />

                            {can('delete_jobs') && (
                            <button
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete?.(job._id)
                                    setMenuOpen(false)
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                            </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
