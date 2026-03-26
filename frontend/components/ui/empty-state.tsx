import * as React from "react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center p-10 md:p-14 border-2 border-dashed border-slate-200 bg-white/50 rounded-3xl mx-auto w-full max-w-3xl",
                className
            )}
            {...props}
        >
            {icon && (
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-orange-50 to-red-50 text-red-600 mb-6 shadow-sm ring-1 ring-red-100/50">
                    <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm">
                        {icon}
                    </div>
                </div>
            )}
            <h3 className="text-[22px] font-semibold tracking-tight text-slate-900 mb-2">
                {title}
            </h3>
            <p className="text-[15px] text-slate-500 mb-8 max-w-[420px] mx-auto leading-relaxed">
                {description}
            </p>
            {action && <div>{action}</div>}
        </div>
    )
}
