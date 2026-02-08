"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload, Rocket, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
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

export function InviteCandidates({ assessmentId }: { assessmentId: string }) {
    const [emailsRaw, setEmailsRaw] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

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
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                        <Rocket className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Ready to launch!</p>
                            <p className="opacity-90 mt-1">
                                Each candidate will receive an email with a unique link. Enter up to 50 emails (comma or newline separated).
                            </p>
                        </div>
                    </div>

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

                    <div className="space-y-4">
                        <Label>Enter Email Addresses (comma or newline separated)</Label>
                        <Textarea
                            placeholder="john@example.com, sarah@example.com, ..."
                            className="min-h-[150px] font-mono text-sm"
                            value={emailsRaw}
                            onChange={(e) => setEmailsRaw(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-muted" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or</span>
                        </div>
                    </div>

                    <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-8 flex flex-col items-center justify-center text-center text-muted-foreground">
                        <Upload className="w-8 h-8 mb-3" />
                        <p className="text-sm font-medium">Upload CSV</p>
                        <p className="text-xs mt-1">Drag and drop or click to upload (coming soon)</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/assessments">Save as Draft</Link>
                        </Button>
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
                                    <Rocket className="w-4 h-4" /> Send Test Link
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
