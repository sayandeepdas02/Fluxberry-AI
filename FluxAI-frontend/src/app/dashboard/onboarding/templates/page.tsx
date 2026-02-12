'use client'

import { TemplateManager } from "@/features/onboarding/components/template-manager";

export default function TemplatesPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Offer Templates</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Create and manage reusable offer letter templates with dynamic variables.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <TemplateManager />
            </div>
        </div>
    );
}
