"use client"

/**
 * Ribbon callback page. Ribbon redirects the candidate here after the interview.
 * Reads cookie via API, gets nextUrl (next round or completed), then redirects.
 */

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { attemptsApi } from "@/lib/api/attempts"
import { Loader2 } from "lucide-react"

export default function RibbonCallbackPage() {
    const router = useRouter()
    const [status, setStatus] = useState<"loading" | "error">("loading")

    useEffect(() => {
        let cancelled = false
        async function run() {
            try {
                const res = await attemptsApi.getRibbonCallbackNextUrl()
                if (cancelled) return
                if (res.success && res.data?.nextUrl) {
                    router.replace(res.data.nextUrl)
                    return
                }
                setStatus("error")
            } catch {
                if (!cancelled) setStatus("error")
            }
        }
        run()
        return () => { cancelled = true }
    }, [router])

    if (status === "error") {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
                <div className="text-center space-y-4">
                    <p className="text-neutral-600">Session expired or invalid. Please start again from your assessment link.</p>
                    <a href="/" className="text-orange-600 hover:underline">Return home</a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
            <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
                <p className="text-neutral-600">Taking you back to your assessment…</p>
            </div>
        </div>
    )
}
