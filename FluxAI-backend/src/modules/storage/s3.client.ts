import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Storage configuration
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'fluxai-uploads'
const REGION = process.env.S3_REGION || 'us-east-1'
const ENDPOINT = process.env.S3_ENDPOINT // For MinIO or other S3-compatible

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
    fileType: 'RESUME' | 'VIDEO',
    extension: string
): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${ownerType.toLowerCase()}/${ownerId}/${fileType.toLowerCase()}/${timestamp}-${random}.${extension}`
}
