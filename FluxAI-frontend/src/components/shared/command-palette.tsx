"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/subscription/subscription-context";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Users, Briefcase, Search, Activity, Settings, LayoutGrid } from "lucide-react";

export function CommandPalette() {
    const [open, setOpen] = React.useState(false);
    const router = useRouter();
    const { hasAccessToApp } = useSubscription();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
            // Add shortcut "j" for jobs when completely outside inputs
            if (e.key === "j" && !(e.target as HTMLElement).matches('input, textarea, [contenteditable]')) {
                e.preventDefault();
                router.push("/dashboard/manage-jobs");
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [router]);

    const runCommand = React.useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Type a command or search..." className="rounded-none border-0" />
            <CommandList className="rounded-none">
                <CommandEmpty>No results found.</CommandEmpty>
                
                <CommandGroup heading="Applications">
                    {hasAccessToApp('job_board') && (
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/manage-jobs"))}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Jobs & Postings</span>
                        </CommandItem>
                    )}
                    {hasAccessToApp('talent_prospect') && (
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/talent-prospect"))}>
                            <Search className="mr-2 h-4 w-4" />
                            <span>Sourcing Engine</span>
                        </CommandItem>
                    )}
                    {hasAccessToApp('ats_screening') && (
                        <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/manage-jobs"))}>
                            <Activity className="mr-2 h-4 w-4" />
                            <span>Candidate Pipelines</span>
                        </CommandItem>
                    )}
                </CommandGroup>
                
                <CommandSeparator />
                
                <CommandGroup heading="Account & System">
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/apps"))}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        <span>App Store / Modules</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/pricing"))}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Billing & Limits</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
