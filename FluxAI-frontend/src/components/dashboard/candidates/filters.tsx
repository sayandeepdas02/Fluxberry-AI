"use client"

import { useCandidatesStore } from '@/lib/store/candidates-store'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function CandidateFilters() {
    const { stage, setStage } = useCandidatesStore()

    return (
        <div className="flex items-center gap-3">
            <Select value={stage} onValueChange={(val) => setStage(val === "ALL" ? "" : val)}>
                <SelectTrigger className="w-[180px] bg-card border-line">
                    <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Stages</SelectItem>
                    <SelectItem value="APPLIED">Applied</SelectItem>
                    <SelectItem value="SCREENING">Screening</SelectItem>
                    <SelectItem value="INTERVIEW">Interview</SelectItem>
                    <SelectItem value="OFFER">Offer</SelectItem>
                    <SelectItem value="HIRED">Hired</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
