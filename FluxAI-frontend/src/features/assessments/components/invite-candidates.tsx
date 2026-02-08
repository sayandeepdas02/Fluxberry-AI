"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Upload, Rocket, Loader2, CheckCircle2, AlertCircle, Copy, Link2 } from "lucide-react"
import Link from "next/link"
import { assessmentsApi } from "@/lib/api/assessments"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseEmails(raw: string): string[] {
    return raw
        .split(/[\n,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0)
}

function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = []
    const invalid: string[] = []
    const seen = new Set<string>()
    for (const e of emails) {
        if (seen.has(e)) continue
        seen.add(e)
        if (EMAIL_REGEX.test(e)) valid.push(e)
        else invalid.push(e)
    }
    return { valid, invalid }
}

const getTestLink = (assessmentId: string) => {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/assessment/${assessmentId}/start`
    }
    return `${process.env.NEXT_PUBLIC_APP_URL || ""}/assessment/${assessmentId}/start`
}

export function InviteCandidates({ assessmentId }: { assessmentId: string }) {
    const [status, setStatus] = useState<"DRAFT" | "ACTIVE" | "CLOSED" | null>(null)
    const [publishLoading, setPublishLoading] = useState(false)
    const [emailsRaw, setEmailsRaw] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        assessmentsApi.getById(assessmentId).then((res) => {
            if (res.success && res.data) setStatus(res.data.status as "DRAFT" | "ACTIVE" | "CLOSED")
        })
    }, [assessmentId])

    const handlePublish = async () => {
        setError(null)
        setPublishLoading(true)
        try {
            const res = await assessmentsApi.publish(assessmentId)
            if (res.success && res.data) {
                setStatus("ACTIVE")
            } else {
                const msg = res.error?.message ?? "Failed to publish."
                const details = res.error && 'details' in res.error && Array.isArray(res.error.details)
                    ? (res.error.details as { message?: string }[]).map((d) => d.message).filter(Boolean).join(" ")
                    : ""
                setError(details ? `${msg} ${details}` : msg)
            }
        } catch {
            setError("Failed to publish. Try again.")
        } finally {
            setPublishLoading(false)
        }
    }

    const handleCopyLink = async () => {
        const url = getTestLink(assessmentId)
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            setError("Could not copy to clipboard.")
        }
    }

    const handleSendInvites = async () => {
        const parsed = parseEmails(emailsRaw)
        const { valid, invalid } = validateEmails(parsed)

        if (invalid.length > 0) {
            setError(`Invalid email(s): ${invalid.slice(0, 5).join(", ")}${invalid.length > 5 ? "…" : ""}`)
            return
        }
        if (valid.length === 0) {
            setError("Enter at least one valid email address.")
            return
        }
        if (valid.length > 50) {
            setError("Maximum 50 emails per request.")
            return
        }

        setError(null)
        setSuccess(null)
        setLoading(true)
        try {
            const res = await assessmentsApi.invite(assessmentId, { emails: valid })
            if (res.success && res.data) {
                setSuccess(res.data.invited)
                setEmailsRaw("")
            } else {
                setError(res.error?.message || "Failed to send invites.")
            }
        } catch {
            setError("Something went wrong. Try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/assessments/${assessmentId}/configure`}>
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Invite Candidates</h1>
                    <p className="text-sm text-muted-foreground">Step 3 of 3: Send test links</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    {status === null && (
                        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Loading…</span>
                        </div>
                    )}
                    {status === "DRAFT" && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-amber-800">
                            <div className="flex gap-3 flex-1">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Only published (ACTIVE) assessments can accept invites</p>
                                    <p className="mt-1 opacity-90">Publish this assessment to share the test link and send invite emails.</p>
                                </div>
                            </div>
                            <Button
                                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 gap-2"
                                onClick={handlePublish}
                                disabled={publishLoading}
                            >
                                {publishLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                                Publish assessment
                            </Button>
                        </div>
                    )}

                    {status === "ACTIVE" && (
                        <>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                                <Rocket className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Ready to launch!</p>
                                    <p className="opacity-90 mt-1">
                                        Share the test link below or send invite emails. Each candidate gets a unique link.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Link2 className="w-4 h-4" /> Test link (share with candidates)
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        readOnly
                                        value={getTestLink(assessmentId)}
                                        className="font-mono text-sm bg-muted"
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={handleCopyLink} title="Copy link">
                                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                                {copied && <p className="text-xs text-green-600">Link copied to clipboard.</p>}
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-muted" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or send by email</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Enter Email Addresses (comma or newline separated)</Label>
                                <Textarea
                                    placeholder="john@example.com, sarah@example.com, ..."
                                    className="min-h-[120px] font-mono text-sm"
                                    value={emailsRaw}
                                    onChange={(e) => setEmailsRaw(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Upload className="w-6 h-6 mb-2" />
                                <p className="text-sm font-medium">Upload CSV</p>
                                <p className="text-xs mt-1">Drag and drop or click to upload (coming soon)</p>
                            </div>
                        </>
                    )}

                    {success !== null && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            <span>Invite emails queued for {success} candidate{success !== 1 ? "s" : ""}.</span>
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/assessments">Back to assessments</Link>
                        </Button>
                        {status === "ACTIVE" && (
                            <Button
                                className="bg-foreground text-background hover:bg-foreground/90 gap-2"
                                onClick={handleSendInvites}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                                    </>
                                ) : (
                                    <>
                                        <Rocket className="w-4 h-4" /> Send Test Link (email)
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
