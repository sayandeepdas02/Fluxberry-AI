"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface OnboardingData {
    fullName: string;
    companyName: string;
    companyWebsite: string;
    role: string;
    productSelection: string;
    workspaceName: string;
    workspaceLogo?: string;
}

interface OnboardingContextType {
    data: OnboardingData;
    updateData: (updates: Partial<OnboardingData>) => void;
    resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = "fluxai_onboarding_draft";

const initialData: OnboardingData = {
    fullName: "",
    companyName: "",
    companyWebsite: "",
    role: "",
    productSelection: "",
    workspaceName: "",
};

function loadDraft(): OnboardingData {
    if (typeof window === "undefined") return initialData;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return initialData;
        const parsed = JSON.parse(raw) as Partial<OnboardingData>;
        // Strip the logo from persisted draft — it's a large base64 blob that
        // we don't want taking up sessionStorage space
        const { workspaceLogo: _, ...rest } = parsed;
        return { ...initialData, ...rest };
    } catch {
        return initialData;
    }
}

function saveDraft(data: OnboardingData): void {
    if (typeof window === "undefined") return;
    try {
        const { workspaceLogo: _, ...rest } = data;
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    } catch {
        // sessionStorage quota exceeded or unavailable — silent fail
    }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<OnboardingData>(loadDraft);

    useEffect(() => {
        saveDraft(data);
    }, [data]);

    const updateData = (updates: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    const resetData = () => {
        setData(initialData);
        if (typeof window !== "undefined") {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    };

    return (
        <OnboardingContext.Provider value={{ data, updateData, resetData }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error("useOnboarding must be used within OnboardingProvider");
    }
    return context;
}
