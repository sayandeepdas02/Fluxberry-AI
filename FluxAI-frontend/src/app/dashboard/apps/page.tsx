"use client";

import React from "react";
import { useSubscription } from "@/lib/subscription/subscription-context";
import { PLATFORM_APPS } from "@/lib/subscription/types";
import { 
    LayoutGrid, 
    CheckCircle2, 
    Sparkles, 
    Briefcase,
    Activity,
    FileText,
    ShoppingBag,
    Search,
    BarChart,
    PlusCircle,
    XCircle,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Utility mapper just for Lucide dynamic access
const ICON_MAP: Record<string, React.FC<any>> = {
    Briefcase,
    Activity,
    FileText,
    ShoppingBag,
    Search,
    BarChart
};

export default function AppMarketplacePage() {
    const { config, installApp, uninstallApp, getTrialDaysRemaining } = useSubscription();

    return (
        <div className="flex flex-col h-full overflow-y-auto bg-muted/5">
            {/* Header Hero Area */}
            <div className="bg-foreground text-background py-16 px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none" 
                     style={{ background: 'radial-gradient(circle at top right, white, transparent 70%)' }} 
                />
                
                <div className="max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-background/10 border border-background/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                        <LayoutGrid className="w-8 h-8 text-background" />
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                        Fluxberry OS Marketplace
                    </h1>
                    <p className="text-lg text-background/70 max-w-2xl font-medium">
                        Customize your hiring engine. Enable core modules, unlock AI-native add-ons, and scale your workspace stack seamlessly.
                    </p>

                    {config.trialActive && (
                        <div className="mt-8 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold rounded-none flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            14-Day Free Trial Active. All Add-ons are currently unlocked automatically.
                        </div>
                    )}
                </div>
            </div>

            {/* Main App Grid Area */}
            <div className="max-w-6xl mx-auto p-8 border-x border-line bg-card flex-1 w-full">
                
                {/* Core Modals Row */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-primary" />
                        Core Modules
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PLATFORM_APPS.filter(app => app.category === 'core').map(app => {
                            const IconComp = ICON_MAP[app.iconName] || Briefcase;
                            const isInstalled = config.apps[app.id]?.installed;
                            
                            return (
                                <div key={app.id} className="border border-line rounded-none p-5 flex flex-col h-full bg-background transition-colors hover:border-primary/30">
                                    <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mb-4">
                                        <IconComp className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{app.name}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 mb-6 flex-1">
                                        {app.description}
                                    </p>
                                    
                                    <div className="pt-4 border-t border-line flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Included in Plan
                                        </span>
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Active
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Premium Add-ons Row */}
                <div>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-emerald-500" />
                        Premium Add-ons
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PLATFORM_APPS.filter(app => app.category === 'add_on').map(app => {
                            const IconComp = ICON_MAP[app.iconName] || Briefcase;
                            const isInstalled = config.apps[app.id]?.installed;
                            const isEnabled = config.apps[app.id]?.enabled;

                            return (
                                <div key={app.id} className={`border p-5 flex flex-col h-full transition-all relative ${isInstalled ? 'border-primary/50 shadow-sm bg-primary/5' : 'border-line bg-background hover:border-foreground/30'}`}>
                                    {config.trialActive && (
                                        <span className="absolute -top-3 right-4 px-2 py-0.5 bg-emerald-500 text-background text-[10px] font-bold uppercase tracking-wider">
                                            Trial Access
                                        </span>
                                    )}

                                    <div className={`w-12 h-12 rounded-none flex items-center justify-center mb-4 ${isInstalled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                        <IconComp className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                        {app.name}
                                        {app.pricingType !== 'included' && (
                                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                        )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1 mb-4 flex-1">
                                        {app.description}
                                    </p>

                                    <div className="mb-6 flex gap-2 flex-wrap">
                                        {app.pricingType === 'credits' && (
                                            <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
                                                Credit-based Billing
                                            </span>
                                        )}
                                        {app.pricingType === 'usage' && (
                                            <span className="text-xs px-2 py-1 bg-purple-500/10 text-purple-600 font-semibold border border-purple-500/20">
                                                Pay per Usage
                                            </span>
                                        )}
                                        {app.pricingType === 'included' && (
                                            <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 font-semibold border border-blue-500/20">
                                                Requires Growth Plan
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
                                        {isInstalled ? (
                                            <Button 
                                                variant="outline"
                                                onClick={() => uninstallApp(app.id)}
                                                className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive h-9 font-medium"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" />
                                                Disable Module
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => installApp(app.id)}
                                                className="w-full bg-foreground text-background hover:bg-foreground/90 h-9 font-semibold"
                                            >
                                                <PlusCircle className="w-4 h-4 mr-2" />
                                                Install & Enable
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
