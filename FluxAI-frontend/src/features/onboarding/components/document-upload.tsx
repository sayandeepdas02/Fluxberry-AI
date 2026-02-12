import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DocumentUploadProps {
    onUpload: (file: File) => Promise<void>;
    acceptedTypes?: string[];
    maxSizeMB?: number;
}

export function DocumentUpload({ onUpload, acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.png'], maxSizeMB = 5 }: DocumentUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate size
            if (selectedFile.size > maxSizeMB * 1024 * 1024) {
                toast.error(`File size exceeds ${maxSizeMB}MB limit.`);
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        // Simulate progress
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        try {
            await onUpload(file);
            setProgress(100);
            setFile(null); // Reset after success
            if (fileInputRef.current) fileInputRef.current.value = '';
            toast.success("Document uploaded successfully!");
        } catch (error) {
            toast.error("Failed to upload document.");
            setProgress(0);
        } finally {
            clearInterval(interval);
            setUploading(false);
            setTimeout(() => setProgress(0), 1000);
        }
    };

    const clearFile = () => {
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    return (
        <div className="border-2 border-dashed rounded-lg p-6 bg-muted/5 hover:bg-muted/10 transition-colors text-center">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={acceptedTypes.join(',')}
                onChange={handleFileChange}
                disabled={uploading}
            />

            {!file ? (
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-sm font-medium">Click to upload or drag and drop</div>
                    <p className="text-xs text-muted-foreground">
                        {acceptedTypes.join(', ')} (Max {maxSizeMB}MB)
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-3 bg-background border rounded-md">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                                <File className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="text-sm font-medium truncate">{file.name}</span>
                                <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                        </div>
                        {!uploading && (
                            <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>

                    {uploading && (
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                        </div>
                    )}

                    <Button onClick={handleUpload} disabled={uploading}>
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Upload Document'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}
