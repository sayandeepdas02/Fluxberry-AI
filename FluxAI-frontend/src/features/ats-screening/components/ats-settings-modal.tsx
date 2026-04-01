"use client"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { atsScreeningApi, AtsJobProfile, AtsWeights, FeedbackSummary } from "@/lib/api/ats-screening"
import { Sliders, Zap, Briefcase, Scale, ThumbsUp, ThumbsDown, ArrowUpRight } from "lucide-react"

// ─────────────────────────────────────────────
// Weight Presets
// ─────────────────────────────────────────────

const PRESETS: Record<string, { label: string; icon: React.ReactNode; weights: AtsWeights; description: string }> = {
    balanced: {
        label: "Balanced",
        icon: <Scale className="h-3.5 w-3.5" />,
        weights: { skills: 0.35, experience: 0.30, projects: 0.20, education: 0.10, signalBoost: 0.05 },
        description: "Equal emphasis across all dimensions",
    },
    skillHeavy: {
        label: "Skill-Heavy",
        icon: <Zap className="h-3.5 w-3.5" />,
        weights: { skills: 0.50, experience: 0.20, projects: 0.15, education: 0.10, signalBoost: 0.05 },
        description: "Prioritize technical skill alignment",
    },
    experienceHeavy: {
        label: "Experience-Heavy",
        icon: <Briefcase className="h-3.5 w-3.5" />,
        weights: { skills: 0.25, experience: 0.45, projects: 0.15, education: 0.10, signalBoost: 0.05 },
        description: "Prioritize relevant experience",
    },
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AtsSettingsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    jobId: string
}

const WEIGHT_LABELS: { key: keyof AtsWeights; label: string; color: string }[] = [
    { key: "skills", label: "Skills", color: "#3b82f6" },
    { key: "experience", label: "Experience", color: "#8b5cf6" },
    { key: "projects", label: "Projects", color: "#06b6d4" },
    { key: "education", label: "Education", color: "#f59e0b" },
    { key: "signalBoost", label: "Signal Boost", color: "#10b981" },
]

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function AtsSettingsModal({ isOpen, onOpenChange, jobId }: AtsSettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<AtsJobProfile | null>(null)
    const [activeTab, setActiveTab] = useState<"thresholds" | "weights" | "feedback">("thresholds")

    // Threshold state
    const [shortlist, setShortlist] = useState(80)
    const [reviewZone, setReviewZone] = useState(60)
    const [autoRejectEnabled, setAutoRejectEnabled] = useState(false)
    const [autoReject, setAutoReject] = useState(0)
    const [showConfirmReject, setShowConfirmReject] = useState(false)

    // Weight state
    const [weights, setWeights] = useState<AtsWeights>({
        skills: 0.35,
        experience: 0.30,
        projects: 0.20,
        education: 0.10,
        signalBoost: 0.05,
    })

    // Feedback state
    const [feedbackData, setFeedbackData] = useState<FeedbackSummary | null>(null)
    const [feedbackLoading, setFeedbackLoading] = useState(false)

    const totalWeight = useMemo(() => {
        return Object.values(weights).reduce((sum, v) => sum + v, 0)
    }, [weights])

    const isWeightValid = Math.abs(totalWeight - 1.0) < 0.015

    useEffect(() => {
        if (isOpen && jobId) {
            loadProfile()
            loadWeights()
            loadFeedback()
        }
    }, [isOpen, jobId])

    const loadProfile = async () => {
        setLoading(true)
        try {
            const res = await atsScreeningApi.getJobProfile(jobId)
            if (res.success && res.data?.profile) {
                const p = res.data.profile
                setProfile(p)
                setShortlist(p.thresholds?.shortlist ?? 80)
                setReviewZone(p.thresholds?.reviewZone ?? 60)
                setAutoReject(p.thresholds?.autoReject ?? 0)
                setAutoRejectEnabled((p.thresholds?.autoReject ?? 0) > 0)
            }
        } catch (error) {
            toast.error("Failed to load ATS settings")
        } finally {
            setLoading(false)
        }
    }

    const loadWeights = async () => {
        try {
            const res = await atsScreeningApi.getWeights(jobId)
            if (res.success && res.data?.weights) {
                setWeights(res.data.weights)
            }
        } catch { /* use defaults */ }
    }

    const loadFeedback = async () => {
        setFeedbackLoading(true)
        try {
            const res = await atsScreeningApi.getFeedbackSummary(jobId)
            if (res.success && res.data?.summary) {
                setFeedbackData(res.data.summary)
            }
        } catch { /* non-critical */ }
        finally { setFeedbackLoading(false) }
    }

    const handleSaveThresholds = async () => {
        if (!profile) return

        if (reviewZone >= shortlist) {
            return toast.error("Review Zone threshold must be less than Shortlist threshold")
        }

        const finalAutoReject = autoRejectEnabled ? autoReject : 0

        if (autoRejectEnabled && finalAutoReject >= reviewZone) {
            return toast.error("Auto Reject threshold must be less than Review Zone threshold")
        }

        setSaving(true)
        try {
            const res = await atsScreeningApi.updateJobProfile(jobId, {
                thresholds: {
                    shortlist,
                    reviewZone,
                    autoReject: finalAutoReject
                }
            })
            if (res.success) {
                toast.success("Threshold settings saved")
            }
        } catch {
            toast.error("Failed to save threshold settings")
        } finally {
            setSaving(false)
        }
    }

    const handleSaveWeights = async () => {
        if (!isWeightValid) {
            return toast.error("Weights must sum to 100%")
        }

        setSaving(true)
        try {
            const res = await atsScreeningApi.updateWeights(jobId, weights)
            if (res.success) {
                toast.success("Scoring weights saved")
            } else {
                toast.error("Failed to save weights")
            }
        } catch {
            toast.error("Failed to save weights")
        } finally {
            setSaving(false)
        }
    }

    const applyPreset = (presetKey: string) => {
        const preset = PRESETS[presetKey]
        if (preset) {
            setWeights({ ...preset.weights })
            toast.info(`Applied "${preset.label}" preset`)
        }
    }

    const handleWeightChange = (key: keyof AtsWeights, value: number) => {
        setWeights(prev => ({ ...prev, [key]: value }))
    }

    const applySuggestion = (dimension: string, delta: number) => {
        const keyMap: Record<string, keyof AtsWeights> = {
            skills: "skills",
            experience: "experience",
            projects: "projects",
            education: "education",
        }
        const key = keyMap[dimension]
        if (!key) return

        const newWeights = { ...weights }
        newWeights[key] = Math.max(0, Math.min(1, newWeights[key] + delta))
        // Normalize to sum to 1
        const total = Object.values(newWeights).reduce((sum, v) => sum + v, 0)
        if (total > 0) {
            for (const k of Object.keys(newWeights) as (keyof AtsWeights)[]) {
                newWeights[k] = newWeights[k] / total
            }
        }

        setWeights(newWeights)
        setActiveTab("weights")
        toast.info(`Applied ${dimension} adjustment — review and save`)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sliders className="h-5 w-5" />
                        ATS Screening Settings
                    </DialogTitle>
                    <DialogDescription>
                        Configure scoring weights, decision thresholds, and view feedback insights.
                    </DialogDescription>
                </DialogHeader>

                {/* Tab Switcher */}
                <div className="flex border-b border-border">
                    <button
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${ activeTab === "thresholds" ? "text-primary" : "text-muted-foreground hover:text-foreground" }`}
                        onClick={() => setActiveTab("thresholds")}
                    >
                        Thresholds
                        {activeTab === "thresholds" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${ activeTab === "weights" ? "text-primary" : "text-muted-foreground hover:text-foreground" }`}
                        onClick={() => setActiveTab("weights")}
                    >
                        Scoring Weights
                        {activeTab === "weights" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium transition-colors relative ${ activeTab === "feedback" ? "text-primary" : "text-muted-foreground hover:text-foreground" }`}
                        onClick={() => setActiveTab("feedback")}
                    >
                        Feedback Insights
                        {activeTab === "feedback" && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground animate-pulse">Loading...</div>
                ) : (
                    <>
                        {/* ── Thresholds Tab ─────────────────────────── */}
                        {activeTab === "thresholds" && (
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="shortlist" className="text-right">
                                        Shortlist
                                    </Label>
                                    <div className="col-span-3">
                                        <Input
                                            id="shortlist"
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={shortlist}
                                            onChange={(e) => setShortlist(Number(e.target.value))}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Scores &ge; this value are auto-shortlisted (Green).</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="reviewZone" className="text-right">
                                        Review Zone
                                    </Label>
                                    <div className="col-span-3">
                                        <Input
                                            id="reviewZone"
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={reviewZone}
                                            onChange={(e) => setReviewZone(Number(e.target.value))}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">Scores between this and Shortlist require manual review (Yellow).</p>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mt-2">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <Switch
                                            id="enable-reject"
                                            checked={autoRejectEnabled}
                                            onCheckedChange={(checked) => {
                                                if (checked && !showConfirmReject) {
                                                    setShowConfirmReject(true)
                                                    return
                                                }
                                                setAutoRejectEnabled(checked)
                                                if (!checked) setShowConfirmReject(false)
                                            }}
                                        />
                                        <Label htmlFor="enable-reject" className="font-semibold text-destructive">Enable Auto Reject</Label>
                                    </div>

                                    {showConfirmReject && !autoRejectEnabled && (
                                        <div className="bg-destructive/10 p-3 rounded-md mb-4 border border-destructive/20">
                                            <p className="text-sm font-medium text-destructive mb-2">Warning: Enabling Auto Reject might permanently disqualify candidates automatically.</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10" onClick={() => { setAutoRejectEnabled(true); setShowConfirmReject(false) }}>I Understand</Button>
                                                <Button size="sm" variant="outline" onClick={() => setShowConfirmReject(false)}>Cancel</Button>
                                            </div>
                                        </div>
                                    )}

                                    {autoRejectEnabled && (
                                        <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="autoReject" className="text-right text-destructive">
                                                Auto Reject
                                            </Label>
                                            <div className="col-span-3">
                                                <Input
                                                    id="autoReject"
                                                    type="number"
                                                    min={1}
                                                    max={100}
                                                    value={autoReject}
                                                    onChange={(e) => setAutoReject(Number(e.target.value))}
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Scores &le; this value trigger auto-rejection.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Weights Tab ──────────────────────────── */}
                        {activeTab === "weights" && (
                            <div className="py-4 space-y-5">
                                {/* Presets */}
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Presets</p>
                                    <div className="flex gap-2">
                                        {Object.entries(PRESETS).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => applyPreset(key)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors"
                                                title={preset.description}
                                            >
                                                {preset.icon}
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Weight Sliders */}
                                <div className="space-y-4">
                                    {WEIGHT_LABELS.map(({ key, label, color }) => (
                                        <div key={key} className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <label className="text-sm font-medium text-foreground">{label}</label>
                                                <span className="text-sm font-semibold tabular-nums" style={{ color }}>
                                                    {Math.round(weights[key] * 100)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min={0}
                                                max={100}
                                                step={5}
                                                value={Math.round(weights[key] * 100)}
                                                onChange={(e) => handleWeightChange(key, Number(e.target.value) / 100)}
                                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, ${color} ${Math.round(weights[key] * 100)}%, hsl(var(--muted)) ${Math.round(weights[key] * 100)}%)`,
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Total indicator */}
                                <div className={`flex items-center justify-between p-3 rounded-md border ${ isWeightValid ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20" }`}>
                                    <span className="text-sm font-medium">Total</span>
                                    <span className={`text-sm ${ isWeightValid ? "text-green-600" : "text-red-600" }`}>
                                        {Math.round(totalWeight * 100)}%
                                        {isWeightValid ? " ✓" : " — must equal 100%"}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ── Feedback Insights Tab ─────────────────── */}
                        {activeTab === "feedback" && (
                            <div className="py-4 space-y-5">
                                {feedbackLoading ? (
                                    <div className="py-8 text-center text-muted-foreground animate-pulse">Loading feedback data...</div>
                                ) : !feedbackData || (feedbackData.totalPositive + feedbackData.totalNegative === 0) ? (
                                    <div className="py-8 text-center">
                                        <p className="text-muted-foreground text-sm">No feedback data yet.</p>
                                        <p className="text-xs text-muted-foreground mt-1">Feedback signals are captured when you shortlist or reject candidates.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Signal Counts */}
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-green-500/20 bg-green-500/5 flex-1">
                                                <ThumbsUp className="h-4 w-4 text-green-600" />
                                                <div>
                                                    <div className="text-lg text-green-700 dark:text-green-400">{feedbackData.totalPositive}</div>
                                                    <div className="text-xs text-green-600/80">Shortlisted</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-red-500/20 bg-red-500/5 flex-1">
                                                <ThumbsDown className="h-4 w-4 text-red-600" />
                                                <div>
                                                    <div className="text-lg text-red-700 dark:text-red-400">{feedbackData.totalNegative}</div>
                                                    <div className="text-xs text-red-600/80">Rejected</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preferred Skills */}
                                        {feedbackData.preferredSkills.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Preferred Skills</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {feedbackData.preferredSkills.slice(0, 8).map((s) => (
                                                        <Badge
                                                            key={s.skill}
                                                            variant="outline"
                                                            className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
                                                        >
                                                            {s.skill}
                                                            <span className="ml-1 text-[10px] opacity-70">+{s.netSignal}</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Avoided Skills */}
                                        {feedbackData.avoidedSkills.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Avoided Skills</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {feedbackData.avoidedSkills.slice(0, 8).map((s) => (
                                                        <Badge
                                                            key={s.skill}
                                                            variant="outline"
                                                            className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                                                        >
                                                            {s.skill}
                                                            <span className="ml-1 text-[10px] opacity-70">{s.netSignal}</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions */}
                                        {feedbackData.suggestions.length > 0 && (
                                            <div>
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">AI Suggestions</p>
                                                <div className="space-y-2">
                                                    {feedbackData.suggestions.map((s, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center justify-between p-3 rounded-md border border-blue-500/20 bg-blue-500/5"
                                                        >
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-foreground">{s.reason}</p>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    {s.dimension}: {Math.round(s.currentWeight * 100)}% →{" "}
                                                                    {Math.round((s.currentWeight + s.suggestedDelta) * 100)}%
                                                                </p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="ml-3 gap-1 text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                                onClick={() => applySuggestion(s.dimension, s.suggestedDelta)}
                                                            >
                                                                <ArrowUpRight className="h-3.5 w-3.5" />
                                                                Apply
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {feedbackData.suggestions.length === 0 && (feedbackData.totalPositive + feedbackData.totalNegative) < 5 && (
                                            <div className="p-3 rounded-md border border-amber-500/20 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400">
                                                Need at least 5 recruiter actions to generate weight suggestions.
                                                Currently: {feedbackData.totalPositive + feedbackData.totalNegative} signals.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    {activeTab !== "feedback" && (
                        <Button
                            onClick={activeTab === "thresholds" ? handleSaveThresholds : handleSaveWeights}
                            disabled={loading || saving || (activeTab === "weights" && !isWeightValid)}
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
