import { useEffect } from "react";
import { useOffers } from "../hooks/use-offers";
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
import { FileText, Send, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import { IOffer } from "@/lib/api/offers";

export function OfferList() {
    const { offers, fetchOffers, loading, sendOffer } = useOffers();

    useEffect(() => {
        fetchOffers();
    }, [fetchOffers]);

    const getStatusBadge = (status: IOffer['status']) => {
        switch (status) {
            case 'DRAFT': return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">Draft</Badge>;
            case 'SENT': return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">Sent</Badge>;
            case 'VIEWED': return <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">Viewed</Badge>;
            case 'ACCEPTED': return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Accepted</Badge>;
            case 'DECLINED': return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Declined</Badge>;
            case 'EXPIRED': return <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">Expired</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    }

    if (loading && offers.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">Loading offers...</div>;
    }

    if (offers.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-muted/10 border-dashed">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No offers yet</h3>
                <p className="text-muted-foreground mt-1 mb-4">Create your first offer to get started.</p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Job</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {offers.map((offer) => (
                        <TableRow key={offer._id}>
                            <TableCell className="font-medium">
                                {/* Population handled in backend 
                                    Assuming populated fields: applicationId.candidateId (which is an object)
                                    But backend populate might be shallow. 
                                    offersService.getOffers populates 'applicationId' with 'jobId candidateId'.
                                    But candidateId inside applicationId is likely an ID unless deeply populated.
                                    Let's handle safe checks.
                                */}
                                {(offer.applicationId as any)?.candidateId ? (
                                    <div className="flex flex-col">
                                        <span>Candidate ID: {(offer.applicationId as any).candidateId}</span>
                                        {/* Ideally we fetch name. For MVP ID is okay or we update backend to deep populate */}
                                    </div>
                                ) : 'Unknown Candidate'}
                            </TableCell>
                            <TableCell>
                                {(offer.applicationId as any)?.jobId || 'Unknown Job'}
                            </TableCell>
                            <TableCell>{getStatusBadge(offer.status)}</TableCell>
                            <TableCell>{format(new Date(offer.createdAt), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                                {offer.expiresAt ? format(new Date(offer.expiresAt), 'MMM d, yyyy') : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {offer.status === 'DRAFT' && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => sendOffer(offer._id)}
                                            className="h-8 gap-1.5"
                                        >
                                            <Send className="w-3.5 h-3.5" />
                                            Send
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <Eye className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                        <a href={offer.pdfUrl} target="_blank" rel="noopener noreferrer">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                        </a>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
