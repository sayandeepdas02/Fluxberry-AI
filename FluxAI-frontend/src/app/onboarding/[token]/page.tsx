"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { atsOnboardingApi, IOnboarding, IOnboardingDocument } from "@/lib/api/ats-onboarding";
import { DocumentUpload } from "@/features/onboarding/components/document-upload";
import {
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Loader2,
    AlertCircle,
    Upload,
    ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PublicOnboardingPage() {
    const params = useParams();
    const token = params?.token as string;

    const [onboarding, setOnboarding] = useState<IOnboarding | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOnboarding = async () => {
        try {
            const response = await atsOnboardingApi.getPublicOnboarding(token);
            if (response.success && response.data) {
                setOnboarding(response.data);
            } else {
                setError("Onboarding session not found or link expired.");
            }
        } catch (err) {
            setError("Failed to load onboarding details.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchOnboarding();
    }, [token]);

    const handleUpload = async (docId: string, file: File) => {
        try {
            // Need to upload file and get URL. 
            // Usually we have an endpoint for direct upload or signed URL.
            // For MVP, atsOnboardingApi.uploadDocument(token, docId, file) doesn't exist yet.
            // Let's check api client.

            // Checking ats-onboarding.ts from memory/previous turns...
            // It has `uploadDocument(token: string, documentId: string, file: File)`.
            // Yes, I implemented it.

            const response = await atsOnboardingApi.uploadDocument(token, docId, file);
            if (response.success) {
                // Refresh data
                fetchOnboarding();
                return;
            } else {
                throw new Error(response.error?.message);
            }
        } catch (e: any) {
            console.error(e);
            throw e; // Propagate to DocumentUpload handler
        }
    }

    const getStatusIcon = (status: IOnboardingDocument['status']) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-5 h-5 text-gray-400" />;
            case 'UPLOADED': return <CheckCircle className="w-5 h-5 text-blue-500" />;
            case 'APPROVED': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Clock className="w-5 h-5 text-gray-400" />;
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (error || !onboarding) return (
        <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h1 className="text-xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">{error || "Invalid onboarding link."}</p>
        </div>
    );

    // Calculate progress
    const totalDocs = onboarding.documents?.length || 0;
    const completedDocs = onboarding.documents?.filter(d => d.status === 'APPROVED' || d.status === 'UPLOADED').length || 0;
    const progress = totalDocs > 0 ? Math.round((completedDocs / totalDocs) * 100) : 0;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">F</div>
                    <span className="font-semibold text-lg">Fluxberry Onboarding</span>
                </div>
                <div className="text-sm text-muted-foreground hidden sm:block">
                    Welcome, {(onboarding.candidateId as any)?.firstName || 'Candidate'}
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
                {/* Hero / Progress */}
                <div className="bg-white rounded-lg shadow-sm border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Onboarding Checklist</h1>
                        <p className="text-muted-foreground mt-1">
                            Please complete the following tasks to get ready for your start date.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-secondary/50 rounded-lg p-3">
                        <div className="text-right">
                            <span className="text-2xl font-bold">{progress}%</span>
                            <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div className="w-12 h-12 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200" />
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-primary transition-all duration-500" strokeDasharray={125.6} strokeDashoffset={125.6 - (progress / 100) * 125.6} />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Documents List */}
                <div className="grid gap-4">
                    {onboarding.documents.map((doc) => (
                        <div key={doc._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b bg-gray-50/50">
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(doc.status)}
                                    <div>
                                        <h3 className="font-semibold">{doc.title}</h3>
                                        <p className="text-sm text-muted-foreground px-0.5">
                                            {doc.description || "Upload required document"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {doc.status === 'PENDING' && <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>}
                                    {doc.status === 'UPLOADED' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Under Review</Badge>}
                                    {doc.status === 'APPROVED' && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>}
                                    {doc.status === 'REJECTED' && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">needs Revision</Badge>}
                                </div>
                            </div>

                            <div className="p-4 sm:px-6">
                                {doc.status === 'APPROVED' ? (
                                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-100">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="font-medium">Document approved! No further action needed.</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {doc.status === 'REJECTED' && doc.feedback && (
                                            <div className="bg-red-50 border border-red-200 p-3 rounded-md text-red-800 text-sm flex gap-2">
                                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <div>
                                                    <span className="font-semibold">Rejection Reason:</span> {doc.feedback}
                                                </div>
                                            </div>
                                        )}

                                        {(doc.status === 'PENDING' || doc.status === 'REJECTED') && (
                                            <DocumentUpload
                                                onUpload={(file) => handleUpload(doc._id, file)}
                                            />
                                        )}

                                        {doc.status === 'UPLOADED' && (
                                            <div className="text-center text-sm text-muted-foreground py-4 bg-muted/20 rounded-md">
                                                Document uploaded. Waiting for recruiter review.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {progress === 100 && (
                    <div className="bg-green-600 text-white rounded-lg p-8 text-center shadow-lg">
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-white/90" />
                        <h2 className="text-2xl font-bold">All Set!</h2>
                        <p className="text-green-100 mt-2 text-lg">
                            You have completed all onboarding tasks. We look forward to seeing you on {format(new Date(onboarding.startDate), 'MMMM d')}!
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
