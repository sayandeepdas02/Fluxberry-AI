import { useEffect, useState } from "react";
import { useATSOnboarding } from "@/features/onboarding/hooks/use-ats-onboarding";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { FileText, CheckCircle, XCircle, Clock, Eye, Download } from "lucide-react";
import { IOnboarding, IOnboardingDocument } from "@/lib/api/ats-onboarding";
import { DocumentReviewModal } from "./document-review-modal";

export function ATSOnboardingList() {
    const { activeOnboardings, fetchActiveOnboardings, loading } = useATSOnboarding();
    const [selectedDocument, setSelectedDocument] = useState<{ onboarding: IOnboarding, document: IOnboardingDocument } | null>(null);

    useEffect(() => {
        fetchActiveOnboardings();
    }, [fetchActiveOnboardings]);

    const getStatusBadge = (status: IOnboardingDocument['status']) => {
        switch (status) {
            case 'PENDING': return <Badge variant="outline" className="text-gray-500">Pending</Badge>;
            case 'UPLOADED': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Uploaded</Badge>;
            case 'APPROVED': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
            case 'REJECTED': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    // Calculate progress
    const getProgress = (onboarding: IOnboarding) => {
        if (!onboarding.documents || onboarding.documents.length === 0) return 0;
        const approved = onboarding.documents.filter(d => d.status === 'APPROVED').length;
        return Math.round((approved / onboarding.documents.length) * 100);
    }

    if (loading && activeOnboardings.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading onboarding candidates...</div>;
    }

    if (activeOnboardings.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-muted/10 border-dashed">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No active onboarding</h3>
                <p className="text-muted-foreground mt-1 mb-4">Candidates who accept offers will appear here.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Candidate</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {activeOnboardings.map((onboarding) => (
                            <TableRow key={onboarding._id}>
                                <TableCell className="font-medium">
                                    {/* Ideally assume population */}
                                    {(onboarding.candidateId as any)?.firstName ?
                                        `${(onboarding.candidateId as any).firstName} ${(onboarding.candidateId as any).lastName}` :
                                        (typeof onboarding.candidateId === 'string' ? onboarding.candidateId : 'Unknown Candidate')
                                    }
                                </TableCell>
                                <TableCell>{format(new Date(onboarding.startDate), 'MMM d, yyyy')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${getProgress(onboarding)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">{getProgress(onboarding)}%</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        {onboarding.documents.map(doc => (
                                            <div
                                                key={doc._id}
                                                className="flex items-center gap-1.5 px-2 py-1 text-xs border rounded-md cursor-pointer hover:bg-muted"
                                                onClick={() => doc.status !== 'PENDING' && setSelectedDocument({ onboarding, document: doc })}
                                            >
                                                <span>{doc.title}</span>
                                                {getStatusBadge(doc.status)}
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Details</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {selectedDocument && (
                <DocumentReviewModal
                    isOpen={!!selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    document={selectedDocument.document}
                    onReviewComplete={() => {
                        fetchActiveOnboardings(); // Refresh
                        setSelectedDocument(null);
                    }}
                />
            )}
        </div>
    );
}
