import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import fs from 'fs'
import path from 'path'

// Storage configuration
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'fluxai-uploads'
const REGION = process.env.S3_REGION || 'us-east-1'
const ENDPOINT = process.env.S3_ENDPOINT // For MinIO or other S3-compatible

// Check if S3 is actually configured
const S3_CONFIGURED = !!(process.env.AWS_ACCESS_KEY_ID || process.env.S3_ENDPOINT)

// Local upload directory for dev mode
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'uploads')

// S3 Client - configured for AWS S3 or S3-compatible storage (MinIO, GCS, etc.)
const s3Client = new S3Client({
    region: REGION,
    ...(ENDPOINT && { endpoint: ENDPOINT, forcePathStyle: true }),
    credentials: process.env.AWS_ACCESS_KEY_ID ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    } : undefined,
})

// Pre-signed URL expiration (15 minutes)
const UPLOAD_URL_EXPIRES_IN = 15 * 60
const DOWNLOAD_URL_EXPIRES_IN = 60 * 60 // 1 hour

export function isS3Configured(): boolean {
    return S3_CONFIGURED
}

export interface UploadUrlResult {
    uploadUrl: string
    storageKey: string
}

export interface DownloadUrlResult {
    downloadUrl: string
}

/**
 * Generate a pre-signed URL for uploading a file
 */
export async function generateUploadUrl(
    storageKey: string,
    mimeType: string,
    size: number
): Promise<UploadUrlResult> {
    if (!S3_CONFIGURED) {
        // Dev mode: return a local upload endpoint
        const serverPort = process.env.PORT || 5001
        const uploadUrl = `http://localhost:${serverPort}/api/uploads/local/${encodeURIComponent(storageKey)}`
        return { uploadUrl, storageKey }
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
        ContentType: mimeType,
        ContentLength: size,
    })

    const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: UPLOAD_URL_EXPIRES_IN,
    })

    return { uploadUrl, storageKey }
}

/**
 * Generate a pre-signed URL for downloading a file
 */
export async function generateDownloadUrl(storageKey: string): Promise<DownloadUrlResult> {
    if (!S3_CONFIGURED) {
        const serverPort = process.env.PORT || 5001
        return { downloadUrl: `http://localhost:${serverPort}/api/uploads/local/${encodeURIComponent(storageKey)}` }
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
    })

    const downloadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: DOWNLOAD_URL_EXPIRES_IN,
    })

    return { downloadUrl }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(storageKey: string): Promise<void> {
    if (!S3_CONFIGURED) {
        const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey)
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        return
    }

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
    })

    await s3Client.send(command)
}

/**
 * Generate a unique storage key for a file
 */
export function generateStorageKey(
    ownerType: 'CANDIDATE' | 'USER',
    ownerId: string,
    fileType: 'RESUME' | 'VIDEO' | 'AI_RECORDING',
    extension: string
): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${ownerType.toLowerCase()}/${ownerId}/${fileType.toLowerCase()}/${timestamp}-${random}.${extension}`
}

/**
 * Get an object from S3 as a Buffer (for STT pipeline)
 */
export async function getObjectBuffer(storageKey: string): Promise<Buffer> {
    if (!S3_CONFIGURED) {
        // Dev mode: read from local filesystem
        const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey)
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath)
        }
        return Buffer.alloc(0) // No file available
    }

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
    })

    const response = await s3Client.send(command)
    const stream = response.Body as NodeJS.ReadableStream
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
        chunks.push(chunk as Uint8Array)
    }
    return Buffer.concat(chunks)
}

/**
 * Save a buffer to local storage (dev mode only)
 */
export function saveLocalFile(storageKey: string, data: Buffer): void {
    const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey)
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, data)
}


/**
 * Upload a server-side buffer to storage and return its public URL
 */
export async function uploadFile(
    storageKey: string,
    buffer: Buffer,
    mimeType: string
): Promise<string> {
    if (!S3_CONFIGURED) {
        // Dev mode: save locally
        const filePath = path.join(LOCAL_UPLOAD_DIR, storageKey)
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(filePath, buffer)

        const serverPort = process.env.PORT || 5001
        return `http://localhost:${serverPort}/api/uploads/local/${encodeURIComponent(storageKey)}`
    }

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
    })

    await s3Client.send(command)

    // Construct Public URL (Or use CloudFront if configured, but for now standard S3)
    if (ENDPOINT) {
        // MinIO or custom
        return `${ENDPOINT}/${BUCKET_NAME}/${storageKey}`
    } else {
        // AWS S3
        return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${storageKey}`
    }
}
