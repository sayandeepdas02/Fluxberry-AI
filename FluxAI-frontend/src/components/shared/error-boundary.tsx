"use client";

import { Component, ReactNode, ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    /** Optional section label shown in the error UI */
    section?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * ErrorBoundary — Issue 12 fix.
 * Wraps any subtree and catches render errors, showing a retry-capable
 * fallback instead of a blank screen. Use it around data-dependent sections.
 *
 * <ErrorBoundary section="Analytics Dashboard">
 *   <AnalyticsView />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        // In production, send to error tracking (Sentry, etc.)
        console.error(`[ErrorBoundary][${this.props.section ?? "Unknown"}]`, error, info);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-destructive/30 rounded-lg bg-destructive/5 min-h-[200px]">
                    <AlertTriangle className="w-10 h-10 text-destructive mb-4" />
                    <h3 className="text-lg font-semibold mb-1">
                        {this.props.section ? `${this.props.section} failed to load` : "Something went wrong"}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                        {this.state.error?.message ?? "An unexpected error occurred. Please try again."}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleReset}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
