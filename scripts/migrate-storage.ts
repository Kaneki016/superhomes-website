import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

async function migrateStorage() {
    console.log('🚀 Starting Storage Migration: Supabase -> DigitalOcean Spaces')

    // 1. Setup Supabase Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Validate Supabase Config
    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase Configuration (URL or Key).')
        console.log('   Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local temporarily.')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Setup S3 Client (DO Spaces)
    const s3Client = new S3Client({
        endpoint: process.env.DO_SPACES_ENDPOINT,
        region: process.env.DO_SPACES_REGION || 'sgp1',
        credentials: {
            accessKeyId: process.env.DO_SPACES_KEY!,
            secretAccessKey: process.env.DO_SPACES_SECRET!
        }
    })

    const BUCKET = process.env.DO_SPACES_BUCKET!
    const FOLDER_PREFIX = process.env.DO_SPACES_FOLDER || ''

    if (!process.env.DO_SPACES_KEY || !process.env.DO_SPACES_SECRET || !BUCKET) {
        console.error('❌ Missing DigitalOcean Spaces Configuration.')
        process.exit(1)
    }

    // 3. List Files from Supabase 'avatars' bucket
    console.log('📦 Listing files from Supabase bucket: "avatars"...')

    // Limits to 1000 files - usually enough for profile pics, otherwise need pagination
    const { data: files, error: listError } = await supabase
        .storage
        .from('avatars')
        .list('', { limit: 1000, offset: 0 })

    if (listError) {
        console.error('❌ Error listing files:', listError.message)
        process.exit(1)
    }

    if (!files || files.length === 0) {
        console.log('⚠️ No files found in "avatars" bucket.')
        return
    }

    console.log(`✅ Found ${files.length} files. Starting migration...`)

    let successCount = 0
    let failCount = 0

    // 4. Migrate Each File
    for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') continue

        console.log(`\n⬇️ Downloading: ${file.name} ...`)
        const { data: fileBlob, error: downloadError } = await supabase
            .storage
            .from('avatars')
            .download(file.name)

        if (downloadError) {
            console.error(`   ❌ Download Failed: ${downloadError.message}`)
            failCount++
            continue
        }

        try {
            // Convert Blob to Buffer
            const arrayBuffer = await fileBlob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Construct Key
            const destinationKey = FOLDER_PREFIX
                ? `${FOLDER_PREFIX}/avatars/${file.name}`
                : `avatars/${file.name}`

            console.log(`   ⬆️ Uploading to DO Spaces: ${destinationKey} ...`)

            const command = new PutObjectCommand({
                Bucket: BUCKET,
                Key: destinationKey,
                Body: buffer,
                ACL: 'public-read',
                ContentType: file.metadata?.mimetype || 'image/jpeg'
            })

            await s3Client.send(command)
            console.log(`   ✅ Success!`)
            successCount++

        } catch (uploadError: any) {
            console.error(`   ❌ Upload Failed: ${uploadError.message}`)
            failCount++
        }
    }

    console.log('\n=============================================')
    console.log(`🎉 Migration Completed!`)
    console.log(`✅ Success: ${successCount}`)
    console.log(`❌ Failed: ${failCount}`)
    console.log('=============================================')
}

migrateStorage().catch(err => console.error(err))
