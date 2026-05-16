import Link from "next/link"

export default function PlaceholderPage() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="text-xl font-semibold text-foreground">Question Banks</h1>
            <p className="text-sm text-muted-foreground">Coming soon — this feature is being built.</p>
            <Link
                href="/dashboard"
                className="mt-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
                Go to Dashboard
            </Link>
        </div>
    )
}
