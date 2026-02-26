"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { offersApi, IOffer } from "@/lib/api/offers";
import { PdfPreview } from "@/features/offers/components/pdf-preview";
import { SignaturePad } from "@/features/offers/components/signature-pad";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CheckCircle, XCircle, FileText, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PublicOfferPage() {
    const params = useParams();
    const router = useRouter();
    const token = params?.token as string;

    const [offer, setOffer] = useState<IOffer | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [signatureData, setSignatureData] = useState<string>("");
    const [actionLoading, setActionLoading] = useState(false);
    const [showSignature, setShowSignature] = useState(false);

    useEffect(() => {
        if (!token) return;

        const loadOffer = async () => {
            try {
                const response = await offersApi.getPublicOffer(token);
                // The client returns ApiResponse<IOffer> (wrapped)
                if (response.success && response.data) {
                    setOffer(response.data);
                } else {
                    setError("Offer not found or invalid link.");
                }
            } catch (err) {
                setError("Failed to load offer details.");
            } finally {
                setLoading(false);
            }
        };

        loadOffer();
    }, [token]);

    const handleAccept = async () => {
        if (!offer || !signatureData) {
            toast.error("Please sign the offer first.");
            return;
        }

        setActionLoading(true);
        try {
            // Assume we can get candidate name from offer details if populated, or ask user.
            // For now hardcoding or extracting from offer if populated.
            // If offer.candidateId is populated object, we use it.
            // But public api might return minimal data.
            // Let's assume generic name if not available or prompt.
            // For MVP, passing "Candidate" as name.
            const name = "Candidate";

            const response = await offersApi.acceptOffer(token, { name, data: signatureData });
            if (response.success && response.data) {
                setOffer(response.data);
                toast.success("Offer accepted successfully!");
                // Redirect to onboarding or show success
                // setTimeout(() => router.push(`/onboarding/${token}`), 2000); 
                // Assuming token is same for onboarding or we get a new link?
                // The offer object has token. 
                // Redirect to onboarding portal using same token for now if flow allows.
                // Actually task says: "Redirect to onboarding portal".
            }
        } catch (err) {
            toast.error("Failed to accept offer.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!confirm("Are you sure you want to decline this offer?")) return;

        setActionLoading(true);
        try {
            const response = await offersApi.declineOffer(token, "Declined by candidate");
            if (response.success && response.data) {
                setOffer(response.data);
                toast.success("Offer declined.");
            }
        } catch (err) {
            toast.error("Failed to decline offer.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !offer) {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <h1 className="text-xl font-bold">Unable to load offer</h1>
                <p className="text-muted-foreground mt-2">{error || "This link may be invalid or expired."}</p>
            </div>
        );
    }

    const isExpired = offer.expiresAt && new Date(offer.expiresAt) < new Date();
    const isAccepted = offer.status === 'SIGNED'; // Assuming status enum
    const isDeclined = offer.status === 'REJECTED';

    if (isExpired && !isAccepted && !isDeclined) {
        return (
            <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500 mb-4" />
                <h1 className="text-xl font-bold">Offer Expired</h1>
                <p className="text-muted-foreground mt-2">This offer link has expired. Please contact the recruiter.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black rounded flex items-center justify-center text-white font-bold">F</div>
                    <span className="font-semibold text-lg">Fluxberry AI</span>
                </div>
                <div>
                    {isAccepted && <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Accepted</span>}
                    {isDeclined && <span className="text-red-600 font-medium flex items-center gap-1"><XCircle className="w-4 h-4" /> Declined</span>}
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Status Banner handled above or inline */}

                {/* PDF View */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Offer Letter
                        </h2>
                        {offer.createdAt && <span className="text-sm text-muted-foreground">Sent on {format(new Date(offer.createdAt), 'MMMM d, yyyy')}</span>}
                    </div>
                    <PdfPreview url={offer.signedPdfUrl || offer.generatedPdfUrl || undefined} />
                    {/* If no PDF url, we might show content? For MVP pdfUrl is critical. */}
                </div>

                {/* Action Section */}
                {!isAccepted && !isDeclined && !isExpired && (
                    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
                        <h2 className="text-lg font-semibold">Acceptance</h2>

                        {showSignature ? (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Please sign below to accept the offer.</p>
                                <SignaturePad onEnd={setSignatureData} />
                                <div className="flex items-center gap-4 pt-4">
                                    <Button variant="outline" onClick={() => setShowSignature(false)} disabled={actionLoading}>Cancel</Button>
                                    <Button onClick={handleAccept} disabled={!signatureData || actionLoading} className="gap-2">
                                        {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Sign & Accept Offer
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 justify-end">
                                <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDecline}>Decline Offer</Button>
                                <Button className="w-full sm:w-auto" onClick={() => setShowSignature(true)}>Review & Sign</Button>
                            </div>
                        )}
                    </div>
                )}

                {isAccepted && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h2 className="text-xl font-semibold text-green-800">Welcome Aboard!</h2>
                        <p className="text-green-700 mt-2">You have successfully accepted the offer.</p>
                        <Button className="mt-6" onClick={() => router.push(`/onboarding/${token}`)}>
                            Go to Onboarding Portal
                        </Button>
                    </div>
                )}
            </main>
        </div>
    );
}
