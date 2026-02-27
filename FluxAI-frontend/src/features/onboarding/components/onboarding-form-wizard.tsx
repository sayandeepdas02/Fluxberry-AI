"use client";

import { useState, useEffect } from "react";
import { IOnboardingFormTemplate, IOnboardingFormResponse, IOnboardingFormField } from "@/lib/api/offers";
import { atsOnboardingApi } from "@/lib/api/ats-onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Save, Send, AlertTriangle } from "lucide-react";

interface FormWizardProps {
    onboardingId: string;
    token: string; // The public onboarding token to access form
    onComplete: () => void;
}

export function OnboardingFormWizard({ onboardingId, token, onComplete }: FormWizardProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [template, setTemplate] = useState<IOnboardingFormTemplate | null>(null);
    const [response, setResponse] = useState<IOnboardingFormResponse | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});

    // Simple pagination if many fields, or just one long form. Let's do a single page MVP for now, 
    // but structure it to allow steps later.

    useEffect(() => {
        const fetchForm = async () => {
            try {
                // We need an API method to fetch the form response via the public token.
                // Assuming it exists at atsOnboardingApi.getOnboardingForm(token)
                const res = await fetch(`/api/public/onboarding/${token}/form`);
                const data = await res.json();

                if (data.success && data.data) {
                    setResponse(data.data);
                    setTemplate(data.data.formTemplateId);
                    setFormData(data.data.responses || {});
                } else {
                    // No form attached
                    onComplete();
                }
            } catch (error) {
                console.error("Failed to load form", error);
                toast.error("Failed to load onboarding form.");
            } finally {
                setLoading(false);
            }
        };
        fetchForm();
    }, [token, onComplete]);

    const handleSaveDraft = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/public/onboarding/${token}/form`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: formData })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Draft saved.");
            } else {
                toast.error(data.message || "Failed to save draft.");
            }
        } catch (error) {
            toast.error("Failed to save draft.");
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async () => {
        // Basic validation
        if (!template) return;

        for (const field of template.fields) {
            if (field.required && !formData[field.id]) {
                toast.error(`Please fill out the required field: ${field.label}`);
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/ api / public / onboarding / ${token} / form / submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ responses: formData })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Form submitted successfully!");
                onComplete();
            } else {
                toast.error(data.message || "Failed to submit form.");
            }
        } catch (error) {
            toast.error("Failed to submit form.");
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field: IOnboardingFormField) => {
        const value = formData[field.id] || "";

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        value={value}
                        onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                );
            case 'dropdown':
                return (
                    <Select value={value} onValueChange={v => setFormData(p => ({ ...p, [field.id]: v }))}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map(opt => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'date':
                return (
                    <Input
                        type="date"
                        value={value}
                        onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                    />
                );
            case 'checkbox':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={!!formData[field.id]}
                            onCheckedChange={c => setFormData(p => ({ ...p, [field.id]: !!c }))}
                            id={field.id}
                        />
                        <label htmlFor={field.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {field.label}
                        </label>
                    </div>
                );
            default:
                return <Input value={value} onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))} />;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!template || response?.status === 'SUBMITTED') {
        // If there is no form attached or it is already submitted, we don't block the UI
        return null;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="mb-6">
                <h2 className="text-xl font-bold">{template.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Please provide the requested information to proceed with onboarding.
                </p>
            </div>

            {response?.status === 'NEEDS_REVISION' && (
                <div className="mb-6 p-4 rounded-md bg-orange-50 border border-orange-200">
                    <h3 className="text-sm font-semibold text-orange-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Revisions Requested
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">
                        The onboarding team has reviewed your submission and requested some changes.
                        Please review the feedback below and resubmit the form.
                    </p>
                </div>
            )}

            <div className="space-y-6">
                {template.fields.map((field) => {
                    const fieldFeedback = response?.status === 'NEEDS_REVISION'
                        ? response.feedback?.find(f => f.fieldId === field.id)
                        : null;

                    return (
                        <div key={field.id} className="space-y-2">
                            {field.type !== 'checkbox' && (
                                <Label className="flex gap-1">
                                    {field.label}
                                    {field.required && <span className="text-red-500">*</span>}
                                </Label>
                            )}
                            {renderField(field)}
                            {fieldFeedback && (
                                <p className="text-sm font-medium text-red-500 mt-1">
                                    {fieldFeedback.message}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center gap-3 mt-8 pt-6 border-t">
                <Button variant="outline" onClick={handleSaveDraft} disabled={saving || submitting}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Draft
                </Button>
                <Button onClick={handleSubmit} disabled={saving || submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Form
                </Button>
            </div>
        </div>
    );
}
