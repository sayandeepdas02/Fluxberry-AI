"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useOnboarding } from "@/features/onboarding/hooks/onboarding-context";
import { onboardingApi } from "@/lib/api/onboarding";
import { useAuth } from "@/lib/context/auth-context";
import { OnboardingShell } from "./onboarding-shell";
import { Upload, X, Loader2 } from "lucide-react";

const MAX_LOGO_BYTES = 1 * 1024 * 1024; // 1MB
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

function getInitials(name: string): string {
    return (
        name
            .trim()
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?"
    );
}

export function OnboardingStep3() {
    const router = useRouter();
    const { data, updateData } = useOnboarding();
    const { refreshUser } = useAuth();

    const [workspaceName, setWorkspaceName] = useState(data.workspaceName || data.companyName || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Logo upload state
    const [logoPreview, setLogoPreview] = useState<string | null>(data.workspaceLogo || null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const processFile = useCallback((file: File) => {
        setUploadError(null);
        if (!ACCEPTED_TYPES.includes(file.type)) {
            setUploadError("Please upload a PNG, JPG, or WebP image.");
            return;
        }
        if (file.size > MAX_LOGO_BYTES) {
            setUploadError("Image must be under 1MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current++;
        setIsDragging(true);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current--;
        if (dragCounter.current === 0) setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const clearLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
        setLogoPreview(null);
        setUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const openFilePicker = () => fileInputRef.current?.click();

    const handleCreateWorkspace = async () => {
        if (!workspaceName.trim()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            updateData({ workspaceName, workspaceLogo: logoPreview || undefined });

            // Legacy compat: backend expects 'ats' | 'hire' | 'both'
            const response = await onboardingApi.complete({
                fullName: data.fullName,
                companyRole: data.role,
                companyWebsite: data.companyWebsite,
                productSelection: "both",
                workspaceName: workspaceName.trim(),
            });

            if (response.success) {
                await refreshUser();
                router.push("/dashboard");
            } else {
                setSubmitError(response.error?.message || "Failed to complete onboarding.");
            }
        } catch {
            setSubmitError("An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const initials = getInitials(workspaceName);

    return (
        <OnboardingShell currentStep={3}>

            {/* Header */}
            <div className="mb-7">
                <h1 className="text-xl font-semibold tracking-tight mb-1.5">Create your workspace</h1>
                <p className="text-sm text-muted-foreground leading-snug">
                    This is where all your hiring activity will live.
                </p>
            </div>

            {/* Submit error */}
            {submitError && (
                <div className="mb-5 px-3 py-2.5 bg-destructive/5 border border-destructive/20 text-destructive text-xs leading-snug">
                    {submitError}
                </div>
            )}

            <div className="space-y-5">

                {/* Workspace name */}
                <div className="space-y-1.5">
                    <Label htmlFor="workspaceName">Workspace Name</Label>
                    <Input
                        id="workspaceName"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="Acme Corp"
                        disabled={isSubmitting}
                        autoFocus
                    />
                    <p className="text-xs text-muted-foreground/60">Usually your company or team name</p>
                </div>

                {/* Logo upload */}
                <div className="space-y-1.5">
                    <Label>
                        Workspace Logo{" "}
                        <span className="text-muted-foreground/60 font-normal text-xs">— optional</span>
                    </Label>

                    <div className="flex items-stretch gap-3">

                        {/* Avatar preview — click-to-upload */}
                        <button
                            type="button"
                            onClick={openFilePicker}
                            disabled={isSubmitting}
                            aria-label="Upload workspace logo"
                            className={cn(
                                "relative group flex-shrink-0 w-14 h-14 border border-line bg-muted/30",
                                "flex items-center justify-center overflow-hidden transition-all duration-150",
                                "hover:border-foreground/25 disabled:pointer-events-none disabled:opacity-50"
                            )}
                        >
                            {logoPreview ? (
                                <>
                                    <img
                                        src={logoPreview}
                                        alt="Workspace logo preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/35 transition-colors duration-150 flex items-center justify-center">
                                        <Upload className="w-3.5 h-3.5 text-background opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-sm font-semibold text-foreground tracking-tighter select-none">
                                        {initials}
                                    </span>
                                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/[0.04] transition-colors duration-150" />
                                </>
                            )}
                        </button>

                        {/* Drag-and-drop zone */}
                        <div
                            role="button"
                            tabIndex={isSubmitting ? -1 : 0}
                            aria-label="Drag and drop logo or click to upload"
                            className={cn(
                                "flex-1 border border-dashed flex flex-col items-center justify-center gap-1",
                                "py-3 px-4 cursor-pointer text-center transition-all duration-150 select-none",
                                isDragging
                                    ? "border-primary/50 bg-primary/5"
                                    : "border-line hover:border-foreground/25 hover:bg-muted/30",
                                isSubmitting && "pointer-events-none opacity-50"
                            )}
                            onClick={openFilePicker}
                            onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
                            onDragEnter={handleDragEnter}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload
                                className={cn(
                                    "w-3.5 h-3.5 mb-0.5 transition-colors duration-150",
                                    isDragging ? "text-primary" : "text-muted-foreground"
                                )}
                            />
                            <span className="text-xs font-medium text-foreground">
                                {isDragging
                                    ? "Drop to upload"
                                    : logoPreview
                                    ? "Replace logo"
                                    : "Click or drag to upload"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60">
                                PNG, JPG, WebP · Max 1MB
                            </span>
                        </div>

                        {/* Remove logo */}
                        {logoPreview && (
                            <button
                                type="button"
                                onClick={clearLogo}
                                disabled={isSubmitting}
                                aria-label="Remove logo"
                                className="self-start w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors duration-150 mt-1 disabled:opacity-50"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {uploadError && (
                        <p className="text-xs text-destructive">{uploadError}</p>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_TYPES.join(",")}
                        className="sr-only"
                        onChange={handleFileInput}
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-line flex items-center justify-between">
                <button
                    onClick={() => router.push("/onboard/step-2")}
                    disabled={isSubmitting}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 disabled:opacity-50"
                >
                    ← Back
                </button>

                <div className="flex items-center gap-1.5">
                    <div className="w-2 h-[3px] bg-primary/40" />
                    <div className="w-2 h-[3px] bg-primary/40" />
                    <div className="w-5 h-[3px] bg-primary" />
                </div>

                <Button
                    onClick={handleCreateWorkspace}
                    disabled={!workspaceName.trim() || isSubmitting}
                    size="sm"
                    className="px-5 font-medium min-w-[130px]"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Creating…
                        </>
                    ) : (
                        "Create Workspace"
                    )}
                </Button>
            </div>

        </OnboardingShell>
    );
}
