"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INDUSTRIES = [
    "Technology",
    "Finance",
    "Healthcare",
    "E-commerce",
    "Education",
    "Other",
] as const;

const COMPANY_SIZES = [
    "1-10",
    "11-50",
    "51-200",
    "201-1000",
    "1000+",
] as const;

const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Toronto",
    "America/Vancouver",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Moscow",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
] as const;

export default function OnboardingSetupPage() {
    const router = useRouter();
    const { user, organization, isLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [form, setForm] = useState({
        companyName: "",
        industry: "" as typeof INDUSTRIES[number] | "",
        companySize: "" as typeof COMPANY_SIZES[number] | "",
        timezone: "Asia/Kolkata",
        tzSearch: "",
    });
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already set up
    useEffect(() => {
        if (!isLoading && organization) {
            const org = organization as any;
            if (org.setupComplete) {
                router.replace("/dashboard");
            }
        }
    }, [isLoading, organization, router]);

    // Pre-fill company name from org if available
    useEffect(() => {
        if (organization?.name) {
            setForm((prev) => ({ ...prev, companyName: organization.name }));
        }
    }, [organization]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const uploadLogo = async (): Promise<string | null> => {
        if (!logoFile) return null;
        const urlRes = await apiClient.get<{ uploadUrl: string; fileKey: string }>(
            "/files/upload-url",
            { type: "logo" }
        );
        if (!urlRes.success || !urlRes.data) return null;
        await fetch(urlRes.data.uploadUrl, {
            method: "PUT",
            body: logoFile,
            headers: { "Content-Type": logoFile.type },
        });
        return urlRes.data.fileKey;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.companyName.trim()) {
            setError("Company name is required");
            return;
        }
        setIsSubmitting(true);
        setError(null);

        let logoKey: string | null = null;
        if (logoFile) {
            logoKey = await uploadLogo();
        }

        const orgId = organization?.id ?? (user as any)?.organizationId;
        if (!orgId) {
            setError("Could not find your organization. Please refresh.");
            setIsSubmitting(false);
            return;
        }

        const res = await apiClient.patch(`/organizations/${orgId}`, {
            name: form.companyName.trim(),
            ...(form.industry && { industry: form.industry }),
            ...(form.companySize && { size: form.companySize }),
            ...(form.timezone && { timezone: form.timezone }),
            ...(logoKey && { logoKey }),
        });

        if (res.success) {
            // Mark onboarding complete on the user record
            await apiClient.post("/onboarding/complete", {
                workspaceName: form.companyName.trim(),
            });
            router.push("/dashboard");
        } else {
            setError(res.error?.message ?? "Failed to save. Please try again.");
            setIsSubmitting(false);
        }
    };

    const filteredTimezones = TIMEZONES.filter((tz) =>
        tz.toLowerCase().includes(form.tzSearch.toLowerCase())
    );

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </main>
        );
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
            <div className="w-full max-w-[520px]">
                {/* Header */}
                <div className="mb-10 text-center">
                    <img src="/favicon.png" alt="Fluxberry" className="mx-auto mb-4 h-10 w-10" />
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Set up your workspace
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Tell us a bit about your company so we can personalise your experience.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 border border-line bg-background p-8"
                >
                    {error && (
                        <div className="rounded p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                            {error}
                        </div>
                    )}

                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name <span className="text-destructive">*</span></Label>
                        <Input
                            id="companyName"
                            value={form.companyName}
                            onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                            placeholder="Acme Inc."
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Logo upload */}
                    <div className="space-y-2">
                        <Label>Company Logo <span className="text-muted-foreground font-normal">(optional)</span></Label>
                        <div className="flex items-center gap-4">
                            {logoPreview ? (
                                <img
                                    src={logoPreview}
                                    alt="Logo preview"
                                    className="h-14 w-14 rounded-lg object-cover border border-line"
                                />
                            ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-line bg-muted text-muted-foreground text-xs">
                                    Logo
                                </div>
                            )}
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isSubmitting}
                                >
                                    Upload image
                                </Button>
                                <p className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Industry */}
                    <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <select
                            id="industry"
                            value={form.industry}
                            onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value as any }))}
                            disabled={isSubmitting}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            <option value="">Select industry</option>
                            {INDUSTRIES.map((i) => (
                                <option key={i} value={i}>{i}</option>
                            ))}
                        </select>
                    </div>

                    {/* Company Size */}
                    <div className="space-y-2">
                        <Label htmlFor="companySize">Company Size</Label>
                        <select
                            id="companySize"
                            value={form.companySize}
                            onChange={(e) => setForm((p) => ({ ...p, companySize: e.target.value as any }))}
                            disabled={isSubmitting}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            <option value="">Select size</option>
                            {COMPANY_SIZES.map((s) => (
                                <option key={s} value={s}>{s} employees</option>
                            ))}
                        </select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                        <Label htmlFor="tzSearch">Timezone</Label>
                        <Input
                            id="tzSearch"
                            placeholder="Search timezones…"
                            value={form.tzSearch}
                            onChange={(e) => setForm((p) => ({ ...p, tzSearch: e.target.value }))}
                            disabled={isSubmitting}
                        />
                        <select
                            value={form.timezone}
                            onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                            disabled={isSubmitting}
                            size={4}
                            className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            {filteredTimezones.map((tz) => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">Selected: {form.timezone}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 border-t border-line pt-6">
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Saving…" : "Continue to Dashboard"}
                        </Button>
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard")}
                            className="text-sm text-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Skip for now
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
