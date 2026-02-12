import { useState } from "react";
import { useATSOnboarding } from "@/features/onboarding/hooks/use-ats-onboarding";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IOnboardingDocument } from "@/lib/api/ats-onboarding";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface DocumentReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: IOnboardingDocument;
    onReviewComplete: () => void;
}

export function DocumentReviewModal({ isOpen, onClose, document, onReviewComplete }: DocumentReviewModalProps) {
    const { reviewDocument, loading } = useATSOnboarding();
    const [feedback, setFeedback] = useState("");
    const [processing, setProcessing] = useState(false);

    const handleApprove = async () => {
        setProcessing(true);
        try {
            await reviewDocument(document._id, 'APPROVED');
            onReviewComplete();
        } catch (e) {
            // handled
        } finally {
            setProcessing(false);
        }
    }

    const handleReject = async () => {
        if (!feedback) {
            toast.error("Please provide feedback for rejection.");
            return;
        }
        setProcessing(true);
        try {
            await reviewDocument(document._id, 'REJECTED', feedback);
            onReviewComplete();
        } catch (e) {
            // handled
        } finally {
            setProcessing(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Review Document: {document.title}</DialogTitle>
                    <DialogDescription>
                        Review the uploaded document and approve or reject it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {document.fileUrl ? (
                        <div className="border rounded-lg overflow-hidden h-[400px] w-full bg-muted/10 flex items-center justify-center">
                            {/* Assuming PDF or Image */}
                            <iframe
                                src={document.fileUrl}
                                className="w-full h-full"
                                title="Document Preview"
                            />
                        </div>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                            Document not available for preview.
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Feedback (Required for Rejection)</label>
                        <Textarea
                            placeholder="Reason for rejection or comments..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between sm:justify-end gap-2">
                    <Button variant="outline" onClick={onClose} disabled={processing}>Cancel</Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={processing}
                        className="gap-2"
                    >
                        {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                        <XCircle className="w-4 h-4" />
                        Reject
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={processing}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                        {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                        <CheckCircle className="w-4 h-4" />
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
