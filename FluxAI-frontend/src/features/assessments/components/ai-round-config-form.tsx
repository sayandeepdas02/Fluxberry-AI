"use client"

/**
 * AIRoundConfigForm
 *
 * Used inside the assessment configure step when Round 3 (AI Video Interview) is enabled.
 * Persists: role, difficulty, maxDurationMinutes, grillingIntensity, maxFundamentalQuestions, maxProjectFollowUps.
 */

import { Brain, Clock, Flame, BookOpen, FolderSearch } from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface AIRoundConfig {
    role: "FRONTEND" | "BACKEND" | "FULLSTACK" | "DEVOPS"
    difficulty: "JUNIOR" | "MID" | "SENIOR"
    maxDurationMinutes: number
    grillingIntensity: "LOW" | "MEDIUM" | "HIGH"
    maxFundamentalQuestions: number
    maxProjectFollowUps: number
}

export const AI_ROUND_CONFIG_DEFAULT: AIRoundConfig = {
    role: "BACKEND",
    difficulty: "MID",
    maxDurationMinutes: 45,
    grillingIntensity: "MEDIUM",
    maxFundamentalQuestions: 5,
    maxProjectFollowUps: 2,
}

interface AIRoundConfigFormProps {
    value: AIRoundConfig
    onChange: (cfg: AIRoundConfig) => void
}

function OptionChip<T extends string>({
    options,
    value,
    onChange,
    labels,
    color = "purple",
}: {
    options: readonly T[]
    value: T
    onChange: (v: T) => void
    labels?: Partial<Record<T, string>>
    color?: "purple" | "orange" | "red"
}) {
    const colors = {
        purple: "border-purple-500 ring-purple-500 bg-purple-50/30 text-purple-700",
        orange: "border-orange-500 ring-orange-500 bg-orange-50/30 text-orange-700",
        red: "border-red-500 ring-red-500 bg-red-50/30 text-red-700",
    }
    return (
        <div className="flex gap-2 flex-wrap">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
                        opt === value
                            ? `${colors[color]} ring-1`
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    )}
                >
                    {labels?.[opt] ?? opt}
                </button>
            ))}
        </div>
    )
}

export function AIRoundConfigForm({ value, onChange }: AIRoundConfigFormProps) {
    const set = <K extends keyof AIRoundConfig>(key: K, val: AIRoundConfig[K]) =>
        onChange({ ...value, [key]: val })

    return (
        <div className="space-y-5 pt-2">

            {/* Role */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Brain className="w-3.5 h-3.5 text-purple-500" />
                    Engineering Track
                </Label>
                <OptionChip
                    options={["BACKEND", "FRONTEND", "FULLSTACK", "DEVOPS"] as const}
                    value={value.role}
                    onChange={v => set("role", v)}
                    labels={{ BACKEND: "Backend", FRONTEND: "Frontend", FULLSTACK: "Fullstack", DEVOPS: "DevOps" }}
                    color="purple"
                />
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                    Seniority Level
                </Label>
                <OptionChip
                    options={["JUNIOR", "MID", "SENIOR"] as const}
                    value={value.difficulty}
                    onChange={v => set("difficulty", v)}
                    labels={{ JUNIOR: "Junior (0–2 yrs)", MID: "Mid (2–5 yrs)", SENIOR: "Senior (5+ yrs)" }}
                    color="purple"
                />
            </div>

            {/* Grilling Intensity */}
            <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Grilling Intensity
                </Label>
                <OptionChip
                    options={["LOW", "MEDIUM", "HIGH"] as const}
                    value={value.grillingIntensity}
                    onChange={v => set("grillingIntensity", v)}
                    labels={{ LOW: "🙂 Low — Friendly", MEDIUM: "🔍 Medium — Probing", HIGH: "🔥 High — Rigorous" }}
                    color="orange"
                />
            </div>

            {/* Duration + Question counts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        Duration
                    </Label>
                    <div className="space-y-1.5">
                        <input
                            type="range"
                            min={20}
                            max={90}
                            step={5}
                            value={value.maxDurationMinutes}
                            onChange={e => set("maxDurationMinutes", Number(e.target.value))}
                            className="w-full accent-purple-600"
                        />
                        <p className="text-xs text-neutral-500 text-center">{value.maxDurationMinutes} minutes</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                        Fundamentals Qs
                    </Label>
                    <div className="space-y-1.5">
                        <input
                            type="range"
                            min={2}
                            max={8}
                            step={1}
                            value={value.maxFundamentalQuestions}
                            onChange={e => set("maxFundamentalQuestions", Number(e.target.value))}
                            className="w-full accent-purple-600"
                        />
                        <p className="text-xs text-neutral-500 text-center">{value.maxFundamentalQuestions} questions</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium">
                        <FolderSearch className="w-3.5 h-3.5 text-neutral-500" />
                        Max Follow-Ups
                    </Label>
                    <div className="space-y-1.5">
                        <input
                            type="range"
                            min={1}
                            max={4}
                            step={1}
                            value={value.maxProjectFollowUps}
                            onChange={e => set("maxProjectFollowUps", Number(e.target.value))}
                            className="w-full accent-purple-600"
                        />
                        <p className="text-xs text-neutral-500 text-center">{value.maxProjectFollowUps} follow-up(s)</p>
                    </div>
                </div>
            </div>

            {/* Summary pill */}
            <div className="bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 text-xs text-purple-700 leading-relaxed">
                <span className="font-semibold">Configuration summary:</span>{" "}
                {value.role} {value.difficulty} interview · {value.maxDurationMinutes}min · {value.maxFundamentalQuestions} technical Qs · {value.maxProjectFollowUps} project follow-ups · {value.grillingIntensity.toLowerCase()} grilling
            </div>
        </div>
    )
}
