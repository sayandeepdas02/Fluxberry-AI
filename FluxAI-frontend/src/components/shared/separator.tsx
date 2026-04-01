import { cn } from "@/lib/utils";

export function Separator({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "w-full h-8 border-y border-gray-100 dark:border-white/10",
                className
            )}
            style={{
                backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 6px,
                    #e5e7eb 6px,
                    #e5e7eb 7px
                )`
            }}
        />
    );
}
