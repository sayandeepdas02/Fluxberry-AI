"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface OnboardingData {
    // Step 1
    fullName: string;
    companyName: string;
    companyWebsite: string;
    role: string;

    // Step 2
    productSelection: string;

    // Step 3
    workspaceName: string;
    workspaceLogo?: string;
}

interface OnboardingContextType {
    data: OnboardingData;
    updateData: (updates: Partial<OnboardingData>) => void;
    resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const initialData: OnboardingData = {
    fullName: "",
    companyName: "",
    companyWebsite: "",
    role: "",
    productSelection: "",
    workspaceName: "",
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<OnboardingData>(initialData);

    const updateData = (updates: Partial<OnboardingData>) => {
        setData((prev) => ({ ...prev, ...updates }));
    };

    const resetData = () => {
        setData(initialData);
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
