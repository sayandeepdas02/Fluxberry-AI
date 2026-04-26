"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, ExternalLink, Briefcase, FileText, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DrawerProps {
    candidate: any
    open: boolean
    onClose: () => void
}

export function CandidateDrawer({ candidate, open, onClose }: DrawerProps) {
    if (!candidate) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto sm:rounded-[24px] p-0 gap-0 shadow-2xl border-0">
                <DialogHeader className="p-8 pb-6 bg-white sticky top-0 z-10 border-b border-slate-100/60 backdrop-blur-xl">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-sm ring-4 ring-slate-50">
                                {candidate.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-[24px] font-bold text-slate-900 leading-none tracking-tight">{candidate.name}</DialogTitle>
                                <DialogDescription className="text-[15px] font-medium text-slate-500 flex items-center gap-2">
                                    {candidate.email}
                                </DialogDescription>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {candidate.job.testEnabled ? (
                                candidate.testScore !== null && candidate.testScore !== undefined ? (
                                    <Badge variant="outline" className={cn(
                                        "text-[12px] font-bold tracking-wider uppercase py-1.5 px-3.5 border-0 shadow-sm",
                                        candidate.testPassed ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                                    )}>
                                        {candidate.testPassed ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                                        {candidate.testPassed ? "TEST PASSED" : "TEST FAILED"} <span className="ml-1 opacity-90">({candidate.testScore.toFixed(0)}%)</span>
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[12px] font-bold tracking-wider uppercase py-1.5 px-3.5 bg-slate-100 text-slate-500 border-0">
                                        Test Pending
                                    </Badge>
                                )
                            ) : null}
                            
                            {candidate.flagged && (
                                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase py-1 px-2.5">
                                    <AlertCircle className="w-3 h-3" />
                                    Flagged ({candidate.tabSwitchCount || 0} Tab Switches)
                                </Badge>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8 bg-slate-50/30">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-[16px] flex flex-col gap-1.5 transition-all hover:border-slate-300">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <Briefcase className="w-4 h-4" />
                                <h4 className="text-[12px] uppercase font-bold tracking-wider">Current CTC</h4>
                            </div>
                            <p className="text-[24px] font-extrabold text-slate-900 tracking-tight">{candidate.currentCTC ? `${candidate.currentCTC} LPA` : "N/A"}</p>
                        </div>
                        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-[16px] flex flex-col gap-1.5 transition-all hover:border-slate-300">
                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                <TargetIcon className="w-4 h-4" />
                                <h4 className="text-[12px] uppercase font-bold tracking-wider">Expected CTC</h4>
                            </div>
                            <p className="text-[24px] font-extrabold text-slate-900 tracking-tight">{candidate.expectedCTC ? `${candidate.expectedCTC} LPA` : "N/A"}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 shadow-sm rounded-[16px] overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-[16px] text-slate-900 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-400" />
                                Application Documents
                            </h3>
                        </div>
                        <div className="p-5 space-y-5">
                            <Button variant="outline" className="w-full h-12 bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-[10px] font-semibold text-[14px]" onClick={() => window.open(candidate.resumeUrl, '_blank')}>
                                <Download className="mr-2 h-4 w-4 text-slate-400" /> View / Download Resume (PDF)
                            </Button>

                            {/* Parsed resume skills display */}
                            {candidate.parsedResume?.skills && candidate.parsedResume.skills.length > 0 && (
                                <div className="space-y-3 pt-3">
                                    <h4 className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">AI Parsed Skills</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {candidate.parsedResume.skills.map((skill: string) => (
                                            <Badge key={skill} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-0 px-3 py-1 text-[13px] font-medium transition-colors">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {Object.keys(candidate.customFields || {}).length > 0 && (
                        <div className="bg-white border border-slate-200 shadow-sm rounded-[16px] overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-[16px] text-slate-900 flex items-center gap-2">
                                    <ClipboardListIcon className="w-5 h-5 text-slate-400" />
                                    Custom Fields
                                </h3>
                            </div>
                            <div className="p-0">
                                <dl className="divide-y divide-slate-100">
                                    {Object.entries(candidate.customFields || {}).map(([key, value], idx) => (
                                        <div key={key} className={cn("px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4", idx % 2 === 0 ? "bg-white" : "bg-slate-50/30")}>
                                            <dt className="text-[13px] font-bold text-slate-500">
                                                {key.replace('custom_', '')}
                                            </dt>
                                            <dd className="text-[14px] font-medium text-slate-900 sm:col-span-2 break-words">
                                                {String(value)}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

function TargetIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}

function ClipboardListIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <path d="M12 11h4" />
            <path d="M12 16h4" />
            <path d="M8 11h.01" />
            <path d="M8 16h.01" />
        </svg>
    )
}
