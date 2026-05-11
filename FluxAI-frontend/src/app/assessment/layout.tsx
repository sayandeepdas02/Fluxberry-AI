"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function AssessmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary section="Assessment">
            {children}
        </ErrorBoundary>
    );
}
