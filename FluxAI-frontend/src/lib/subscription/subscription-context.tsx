"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AppRegistryState, PricingTier, SubscriptionConfig, PLATFORM_APPS } from "./types";
import { useAuth } from "@/lib/context/auth-context";

interface SubscriptionContextType {
    config: SubscriptionConfig;
    isLoading: boolean;
    getTrialDaysRemaining: () => number;
    installApp: (appId: string) => void;
    uninstallApp: (appId: string) => void;
    upgradePlan: (plan: PricingTier) => void;
    hasAccessToApp: (routeId: string) => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Generate default config - Core apps default True
const DEFAULT_APPS: AppRegistryState = {
    job_board: { enabled: true, installed: true },
    ats_screening: { enabled: true, installed: true, limits: { resumes: 1000 } },
    onboarding: { enabled: true, installed: true },
    interview_agent: { enabled: false, installed: false }, // Explicit uninstalled default for modules
    talent_prospect: { enabled: false, installed: false, limits: { credits: 1000 } },
    analytics: { enabled: false, installed: false }
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    
    // Default to isolated loading until Client Storage syncs.
    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<SubscriptionConfig>({
        plan: "free",
        trialActive: false,
        trialEndsAt: null,
        apps: DEFAULT_APPS
    });

    // 14-Day Trial Initialization Mechanism
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setIsLoading(false);
            return;
        }

        const lsKey = `fluxOS_subs_${user.id}`;
        const stored = localStorage.getItem(lsKey);

        if (stored) {
            try {
                const parsed = JSON.parse(stored) as SubscriptionConfig;
                // Recalculate trial active logic based on clock
                if (parsed.trialEndsAt) {
                    parsed.trialActive = new Date() < new Date(parsed.trialEndsAt);
                }
                setConfig(parsed);
            } catch (e) {
                console.error("Subscription cache corrupt.");
            }
        } else {
            // New User Migration - Give 14 Day Trial Instantly!
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 14);
            
            // Force Install everything for extreme Trial Experience
            const trialApps = { ...DEFAULT_APPS };
            PLATFORM_APPS.forEach(app => {
                trialApps[app.id] = { enabled: true, installed: true, limits: { credits: 50 } };
            });

            const newConfig: SubscriptionConfig = {
                plan: "free",
                trialActive: true,
                trialEndsAt: endDate.toISOString(),
                apps: trialApps
            };
            
            setConfig(newConfig);
            localStorage.setItem(lsKey, JSON.stringify(newConfig));
        }
        setIsLoading(false);
    }, [isAuthenticated, user?.id]);

    // Persist changes
    useEffect(() => {
        if (isAuthenticated && user && !isLoading) {
            localStorage.setItem(`fluxOS_subs_${user.id}`, JSON.stringify(config));
        }
    }, [config, isAuthenticated, user, isLoading]);

    const getTrialDaysRemaining = () => {
        if (!config.trialActive || !config.trialEndsAt) return 0;
        const diff = new Date(config.trialEndsAt).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    const installApp = (appId: string) => {
        setConfig(prev => ({
            ...prev,
            apps: {
                ...prev.apps,
                [appId]: { enabled: true, installed: true, limits: prev.apps[appId]?.limits || {} }
            }
        }));
    };

    const uninstallApp = (appId: string) => {
        setConfig(prev => ({
            ...prev,
            apps: {
                ...prev.apps,
                [appId]: { ...prev.apps[appId], enabled: false, installed: false }
            }
        }));
    };

    const upgradePlan = (plan: PricingTier) => {
        setConfig(prev => ({
            ...prev,
            plan,
            trialActive: false // Overwrite trial mode when paying
        }));
    };

    // The core Route Guards system logic
    const hasAccessToApp = (routeId: string): boolean => {
        if (config.trialActive) return true; // Ultimate Trial Access God Mode 

        const targetAppMap = PLATFORM_APPS.find(p => p.routeId.includes(routeId) || routeId.includes(p.routeId));
        if (!targetAppMap) return true; // Ignore unmapped routes like dashboard/settings
        
        const appState = config.apps[targetAppMap.id];
        return appState ? (appState.installed && appState.enabled) : false;
    };

    return (
        <SubscriptionContext.Provider value={{
            config,
            isLoading,
            getTrialDaysRemaining,
            installApp,
            uninstallApp,
            upgradePlan,
            hasAccessToApp
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        // Return a safe fallback context for public pages (e.g., landing page)
        return {
            config: { plan: "free", trialActive: false, trialEndsAt: null, apps: {} },
            isLoading: false,
            getTrialDaysRemaining: () => 0,
            installApp: () => {},
            uninstallApp: () => {},
            upgradePlan: () => {},
            hasAccessToApp: () => false
        } as any as SubscriptionContextType;
    }
    return context;
}
