"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { atsScreeningApi, AtsJobProfile } from "@/lib/api/ats-screening"

interface AtsSettingsModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    jobId: string
}

export function AtsSettingsModal({ isOpen, onOpenChange, jobId }: AtsSettingsModalProps) {
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<AtsJobProfile | null>(null)

    // Local state for thresholds
    const [shortlist, setShortlist] = useState(80)
    const [reviewZone, setReviewZone] = useState(60)
    const [autoRejectEnabled, setAutoRejectEnabled] = useState(false)
    const [autoReject, setAutoReject] = useState(0)
    const [showConfirmReject, setShowConfirmReject] = useState(false)

    useEffect(() => {
        if (isOpen && jobId) {
            loadProfile()
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

    const handleSave = async () => {
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
                toast.success("Settings saved successfully")
                onOpenChange(false)
            } else {
                toast.error("Failed to save ATS settings")
            }
        } catch (error) {
            toast.error("Failed to save ATS settings")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>ATS Screening Settings</DialogTitle>
                    <DialogDescription>
                        Configure score thresholds that dictate automated rules and UI color grades.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-8 text-center text-muted-foreground animate-pulse">Loading...</div>
                ) : (
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
                                <p className="text-xs text-muted-foreground mt-1">Scores &ge; this value trigger SCREENING_SCORE_ABOVE events (Green).</p>
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
                                        <p className="text-xs text-muted-foreground mt-1">Scores &le; this value trigger SCREENING_SCORE_BELOW events.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading || saving}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
