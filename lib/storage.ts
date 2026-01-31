import 'server-only'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 Client for DigitalOcean Spaces
const s3Client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT,
    region: process.env.DO_SPACES_REGION || 'sgp1',
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY!,
        secretAccessKey: process.env.DO_SPACES_SECRET!
    }
})

export async function uploadFileToStorage(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'avatars'
): Promise<{ url: string | null, error: string | null }> {
    try {
        // Construct Key (Path)
        // If a global folder prefix is set (e.g. 'superhomes'), use it.
        const globalPrefix = process.env.DO_SPACES_FOLDER || ''
        const key = globalPrefix
            ? `${globalPrefix}/${folder}/${fileName}`
            : `${folder}/${fileName}`

        const bucketName = process.env.DO_SPACES_BUCKET

        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: fileBuffer,
            ACL: 'public-read', // Make file publicly accessible
            ContentType: contentType
        })

        await s3Client.send(command)

        // Construct Public URL
        // Format: https://{bucket}.{region}.digitaloceanspaces.com/{key}
        // OR if custom endpoint: {endpoint}/{bucket}/{key} -> Wait, DO Spaces URL is usually {bucket}.{endpoint}/{key}
        // But the SDK uses endpoint.
        // Let's use the standard publicly accessible URL format for DO Spaces CDN/Edge
        // Default: https://{bucket}.{region}.digitaloceanspaces.com/{key}

        // However, if process.env.DO_SPACES_ENDPOINT is "https://sgp1.digitaloceanspaces.com"
        // The URL is https://supergroups.sgp1.digitaloceanspaces.com/superhomes/avatars/filename.jpg

        // Clean endpoint to remove protocol for construction if needed, or just build standard URL
        const region = process.env.DO_SPACES_REGION || 'sgp1'
        const url = `https://${bucketName}.${region}.digitaloceanspaces.com/${key}`

        return { url, error: null }
    } catch (error: any) {
        console.error('S3 Upload Error:', error)
        return { url: null, error: error.message }
    }
}
