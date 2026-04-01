"use client";

import React from "react";
import { useSubscription } from "./subscription-context";
import { Lock, Rocket, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function withAppGuard<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    routeId: string
) {
    return function AppGuardWrapper(props: P) {
        const { hasAccessToApp, isLoading, config } = useSubscription();

        if (isLoading) {
             return (
                 <div className="flex-1 flex items-center justify-center min-h-[50vh]">
                     <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                 </div>
             )
        }

        const accessGranted = hasAccessToApp(routeId);

        if (!accessGranted) {
             return (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] bg-background">
                     <div className="w-16 h-16 rounded-2xl bg-muted/20 border border-line flex items-center justify-center mb-6">
                         <Lock className="w-8 h-8 text-muted-foreground" />
                     </div>
                     <h2 className="text-2xl tracking-tight mb-2">Upgrade Required</h2>
                     <p className="text-muted-foreground max-w-sm mb-8">
                         This module is an add-on that requires an active Growth Plan or higher. Your {config.trialActive ? 'trial has expired' : 'free plan does not include this feature'}.
                     </p>
                     
                     <div className="flex items-center gap-4">
                         <Link href="/dashboard/apps">
                             <Button variant="outline" className="rounded-none border-line h-10 px-6 font-medium">
                                 Browse App Store
                             </Button>
                         </Link>
                         <Link href="/dashboard/pricing">
                             <Button className="rounded-none h-10 px-6 font-medium text-background bg-foreground hover:opacity-90">
                                 <Zap className="w-4 h-4 mr-2" />
                                 Upgrade Plan
                             </Button>
                         </Link>
                     </div>
                 </div>
             )
        }

        return <WrappedComponent {...props} />;
    };
}
