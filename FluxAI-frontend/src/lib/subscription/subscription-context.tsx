"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { AppRegistryState, PricingTier, SubscriptionConfig, PLATFORM_APPS } from "./types";
import { useAuth } from "@/lib/context/auth-context";
import { billingApi } from "@/lib/api/billing";

interface SubscriptionContextType {
    config: SubscriptionConfig;
    isLoading: boolean;
    getTrialDaysRemaining: () => number;
    installApp: (appId: string) => Promise<void>;
    uninstallApp: (appId: string) => Promise<void>;
    upgradePlan: (plan: PricingTier) => void;
    hasAccessToApp: (routeId: string) => boolean;
    refetch: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Fallback config used while loading or when unauthenticated
const EMPTY_CONFIG: SubscriptionConfig = {
    plan: "free",
    trialActive: false,
    trialEndsAt: null,
    apps: {} as AppRegistryState,
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated } = useAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [config, setConfig] = useState<SubscriptionConfig>(EMPTY_CONFIG);

    const fetchStatus = useCallback(async () => {
        if (!isAuthenticated || !user) {
            setConfig(EMPTY_CONFIG);
            setIsLoading(false);
            return;
        }

        try {
            const response = await billingApi.getStatus();
            if (response.success && response.data) {
                const { plan, trialActive, trialEndsAt, apps } = response.data;
                setConfig({
                    plan: plan as PricingTier,
                    trialActive,
                    trialEndsAt,
                    apps: apps as AppRegistryState,
                });
            }
        } catch (err) {
            // Network failure — fall back to conservative empty config (deny access until resolved)
            console.error("[SubscriptionProvider] Failed to fetch billing status:", err);
            setConfig(EMPTY_CONFIG);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user?.id]);

    // Fetch on mount and whenever auth state changes
    useEffect(() => {
        setIsLoading(true);
        fetchStatus();
    }, [fetchStatus]);

    const getTrialDaysRemaining = () => {
        if (!config.trialActive || !config.trialEndsAt) return 0;
        const diff = new Date(config.trialEndsAt).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
    };

    const installApp = async (appId: string) => {
        try {
            const response = await billingApi.installApp(appId);
            if (response.success && response.data) {
                const { plan, trialActive, trialEndsAt, apps } = response.data;
                setConfig({ plan: plan as PricingTier, trialActive, trialEndsAt, apps: apps as AppRegistryState });
            }
        } catch (err) {
            console.error("[SubscriptionProvider] Failed to install app:", err);
            throw err;
        }
    };

    const uninstallApp = async (appId: string) => {
        try {
            const response = await billingApi.uninstallApp(appId);
            if (response.success && response.data) {
                const { plan, trialActive, trialEndsAt, apps } = response.data;
                setConfig({ plan: plan as PricingTier, trialActive, trialEndsAt, apps: apps as AppRegistryState });
            }
        } catch (err) {
            console.error("[SubscriptionProvider] Failed to uninstall app:", err);
            throw err;
        }
    };

    // upgradePlan is a client-side optimistic update — the real upgrade
    // will be driven by a Stripe webhook in the future (Issue: Billing System roadmap)
    const upgradePlan = (plan: PricingTier) => {
        setConfig(prev => ({ ...prev, plan, trialActive: false }));
    };

    // The core route guard: trial grants access to everything
    const hasAccessToApp = (routeId: string): boolean => {
        if (isLoading) return true; // Don't flash-redirect while loading

        if (config.trialActive) return true; // Trial = god-mode access

        const targetApp = PLATFORM_APPS.find(
            p => p.routeId.includes(routeId) || routeId.includes(p.routeId)
        );
        if (!targetApp) return true; // Unmapped routes (dashboard/settings) are always accessible

        const appState = config.apps[targetApp.id];
        return appState ? appState.installed && appState.enabled : false;
    };

    return (
        <SubscriptionContext.Provider value={{
            config,
            isLoading,
            getTrialDaysRemaining,
            installApp,
            uninstallApp,
            upgradePlan,
            hasAccessToApp,
            refetch: fetchStatus,
        }}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        // Safe fallback for public pages (landing, /offer/:token, etc.)
        return {
            config: EMPTY_CONFIG,
            isLoading: false,
            getTrialDaysRemaining: () => 0,
            installApp: async () => {},
            uninstallApp: async () => {},
            upgradePlan: () => {},
            hasAccessToApp: () => false,
            refetch: async () => {},
        } as unknown as SubscriptionContextType;
    }
    return context;
}
