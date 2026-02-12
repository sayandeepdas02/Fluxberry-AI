export function PdfPreview({ url }: { url?: string }) {
    if (!url) return null;

    return (
        <div className="border rounded-lg overflow-hidden h-[600px] w-full bg-muted/10 flex items-center justify-center">
            <iframe
                src={url}
                className="w-full h-full"
                title="Offer PDF Preview"
            />
        </div>
    );
}
