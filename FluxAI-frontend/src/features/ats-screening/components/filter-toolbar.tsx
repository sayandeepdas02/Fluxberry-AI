"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import { AtsFilterParams } from "@/lib/api/ats-screening"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface FilterToolbarProps {
    filters: AtsFilterParams
    onFiltersChange: (filters: AtsFilterParams) => void
}

const DECISION_OPTIONS = [
    { value: "", label: "All Decisions" },
    { value: "SHORTLISTED", label: "Shortlisted" },
    { value: "REVIEW", label: "Needs Review" },
    { value: "REJECTED", label: "Rejected" },
    { value: "PARSE_FAILED", label: "Parse Failed" },
]

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function FilterToolbar({ filters, onFiltersChange }: FilterToolbarProps) {
    const [searchInput, setSearchInput] = useState(filters.search || "")
    const [scoreMin, setScoreMin] = useState(filters.scoreMin?.toString() || "")
    const [scoreMax, setScoreMax] = useState(filters.scoreMax?.toString() || "")

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            const trimmed = searchInput.trim()
            if (trimmed !== (filters.search || "")) {
                onFiltersChange({ ...filters, search: trimmed || undefined })
            }
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    const handleDecisionChange = useCallback((value: string) => {
        onFiltersChange({ ...filters, decision: value || undefined })
    }, [filters, onFiltersChange])

    const handleScoreApply = useCallback(() => {
        const min = scoreMin ? parseInt(scoreMin) : undefined
        const max = scoreMax ? parseInt(scoreMax) : undefined
        onFiltersChange({ ...filters, scoreMin: min, scoreMax: max })
    }, [filters, onFiltersChange, scoreMin, scoreMax])

    const handleClear = useCallback(() => {
        setSearchInput("")
        setScoreMin("")
        setScoreMax("")
        onFiltersChange({})
    }, [onFiltersChange])

    const hasActiveFilters = !!(filters.search || filters.decision || filters.scoreMin != null || filters.scoreMax != null)

    const currentDecisionLabel = DECISION_OPTIONS.find(o => o.value === (filters.decision || ""))?.label || "All Decisions"

    return (
        <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-[320px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-9 h-9 text-sm"
                />
            </div>

            {/* Decision Filter */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={`gap-1.5 h-9 ${filters.decision ? "border-primary/50 bg-primary/5" : ""}`}
                    >
                        <Filter className="h-3.5 w-3.5" />
                        {currentDecisionLabel}
                        <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {DECISION_OPTIONS.map((opt) => (
                        <DropdownMenuItem
                            key={opt.value}
                            onClick={() => handleDecisionChange(opt.value)}
                            className={filters.decision === opt.value ? "bg-accent" : ""}
                        >
                            {opt.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Score Range */}
            <div className="flex items-center gap-1.5">
                <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    max={100}
                    value={scoreMin}
                    onChange={(e) => setScoreMin(e.target.value)}
                    onBlur={handleScoreApply}
                    onKeyDown={(e) => e.key === "Enter" && handleScoreApply()}
                    className="w-[72px] h-9 text-sm text-center"
                />
                <span className="text-xs text-muted-foreground">–</span>
                <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    max={100}
                    value={scoreMax}
                    onChange={(e) => setScoreMax(e.target.value)}
                    onBlur={handleScoreApply}
                    onKeyDown={(e) => e.key === "Enter" && handleScoreApply()}
                    className="w-[72px] h-9 text-sm text-center"
                />
            </div>

            {/* Clear */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="gap-1 h-9 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                    Clear
                </Button>
            )}
        </div>
    )
}
