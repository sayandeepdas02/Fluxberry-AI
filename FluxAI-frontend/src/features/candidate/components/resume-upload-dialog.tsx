'use client'

import { useRef, useState } from 'react'
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface ResumeUploadDialogProps {
    candidateId: string
    candidateName: string
    onClose: () => void
    onSuccess: () => void
}

type UploadState = 'idle' | 'requesting' | 'uploading' | 'attaching' | 'done' | 'error'

export function ResumeUploadDialog({
    candidateId,
    candidateName,
    onClose,
    onSuccess,
}: ResumeUploadDialogProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [file, setFile] = useState<File | null>(null)
    const [state, setState] = useState<UploadState>('idle')
    const [progress, setProgress] = useState(0)
    const [errorMsg, setErrorMsg] = useState('')

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (!f) return
        if (f.type !== 'application/pdf') {
            toast.error('Only PDF files are accepted')
            return
        }
        if (f.size > 5 * 1024 * 1024) {
            toast.error('File must be under 5 MB')
            return
        }
        setFile(f)
        setErrorMsg('')
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f) {
            if (f.type !== 'application/pdf') { toast.error('Only PDF files are accepted'); return }
            if (f.size > 5 * 1024 * 1024) { toast.error('File must be under 5 MB'); return }
            setFile(f)
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setState('requesting')
        setProgress(10)

        try {
            // Step 1: Request pre-signed upload URL
            const urlRes = await apiClient.post<{
                fileId: string
                uploadUrl: string
                expiresIn: number
            }>('/files/upload-url', {
                fileType: 'RESUME',
                mimeType: file.type,
                size: file.size,
                candidateId,
            })

            if (!urlRes.success || !urlRes.data) throw new Error('Failed to get upload URL')

            const { fileId, uploadUrl } = urlRes.data
            setState('uploading')
            setProgress(40)

            // Step 2: PUT directly to S3 / local storage
            const putRes = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type },
            })

            if (!putRes.ok) throw new Error(`Upload failed: ${putRes.statusText}`)
            setProgress(75)
            setState('attaching')

            // Step 3: Attach to candidate record
            const attachRes = await apiClient.post(`/candidates/${candidateId}/resume`, { fileId })
            if (!attachRes.success) throw new Error('Failed to link resume to candidate')

            setProgress(100)
            setState('done')
            toast.success('Resume uploaded successfully')
            setTimeout(onSuccess, 800)
        } catch (err: any) {
            setState('error')
            setErrorMsg(err.message || 'Upload failed. Please try again.')
            setProgress(0)
        }
    }

    const stateLabel: Record<UploadState, string> = {
        idle: '',
        requesting: 'Preparing upload...',
        uploading: 'Uploading file...',
        attaching: 'Linking to candidate...',
        done: 'Done!',
        error: 'Upload failed',
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Resume</DialogTitle>
                    <DialogDescription>
                        Upload a PDF resume for <span className="font-medium text-foreground">{candidateName}</span>.
                        Max size: 5 MB.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Drop zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => inputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                            file
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'
                        }`}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText className="h-10 w-10 text-primary" />
                                <p className="font-medium text-foreground text-sm">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1"
                                >
                                    <X className="h-3 w-3" /> Remove
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-10 w-10 text-muted-foreground/50" />
                                <p className="text-sm font-medium text-foreground">
                                    Drop PDF here or click to browse
                                </p>
                                <p className="text-xs text-muted-foreground">PDF only · max 5 MB</p>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {state !== 'idle' && state !== 'error' && (
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{stateLabel[state]}</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-1.5" />
                        </div>
                    )}

                    {/* Done */}
                    {state === 'done' && (
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                            <CheckCircle className="h-4 w-4" />
                            Resume linked to candidate profile.
                        </div>
                    )}

                    {/* Error */}
                    {state === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            {errorMsg}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="outline" onClick={onClose} disabled={state === 'uploading' || state === 'attaching' || state === 'requesting'}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || state !== 'idle' && state !== 'error'}
                        >
                            {state === 'idle' || state === 'error' ? (
                                <><Upload className="h-4 w-4 mr-2" /> Upload Resume</>
                            ) : state === 'done' ? (
                                <><CheckCircle className="h-4 w-4 mr-2" /> Done</>
                            ) : (
                                'Uploading...'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
