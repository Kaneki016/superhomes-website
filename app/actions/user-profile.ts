'use server'

import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function updateUserProfile(formData: { name?: string, phone?: string }) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const { name, phone } = formData

    try {
        // Determine user type and update appropriate table
        // We can try updating both or check which one exists.
        // Checking first is safer.

        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${user.id}`

        if (buyer) {
            await sql`
                UPDATE buyers 
                SET name = ${name ?? null}, phone = ${phone ?? null}, updated_at = NOW()
                WHERE auth_id = ${user.id}
            `
        } else {
            // Try agent
            const [agent] = await sql`SELECT id FROM contacts WHERE auth_id = ${user.id}`
            if (agent) {
                await sql`
                    UPDATE contacts
                    SET name = ${name ?? null}, phone = ${phone ?? null}, updated_at = NOW()
                    WHERE auth_id = ${user.id}
                 `
            } else {
                // Create buyer profile if neither exists?
                // Or validation error.
                // Let's assume creates buyer profile for safety if missing
                await sql`
                    INSERT INTO buyers (auth_id, email, user_type, name, phone, updated_at)
                    VALUES (${user.id}, ${user.email ?? null}, 'buyer', ${name ?? null}, ${phone ?? null}, NOW())
                  `
            }
        }

        revalidatePath('/profile')
        return { success: true }
    } catch (error: any) {
        console.error('Update profile error:', error)
        return { success: false, error: error.message || 'Failed to update user profile' }
    }
}

import { uploadFileToStorage } from '@/lib/storage'

export async function uploadProfileImage(formData: FormData) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const file = formData.get('file') as File
    if (!file) {
        return { success: false, error: 'No file provided' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to DigitalOcean Spaces via S3 (Bucket: supergroups / Folder: superhomes/avatars)
        const { url: publicUrl, error: uploadError } = await uploadFileToStorage(
            buffer,
            fileName,
            file.type,
            'avatars'
        )

        if (uploadError || !publicUrl) throw new Error(uploadError || 'Upload failed')

        // Update profile with new URL
        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${user.id}`

        if (buyer) {
            // Future: Update buyer profile if we add photo_url to buyers table
            // For now, we return success so the frontend might eagerly update state
        } else {
            const [agent] = await sql`SELECT id FROM contacts WHERE auth_id = ${user.id}`
            if (agent) {
                await sql`
                    UPDATE contacts SET photo_url = ${publicUrl} WHERE id = ${agent.id}
                 `
            }
        }

        return { success: true, url: publicUrl }

    } catch (error: any) {
        console.error('Upload error:', error)
        return { success: false, error: error.message }
    }
}

export async function updateUserCredentials(email: string, password: string) {
    const session = await auth()
    const user = session?.user

    if (!user || !user.id) {
        return { success: false, error: 'Unauthorized' }
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Update users table
        await sql`
            UPDATE users 
            SET email = ${email}, password = ${hashedPassword}
            WHERE id = ${user.id}
        `

        return { success: true }
    } catch (error: any) {
        console.error('Update credentials error:', error)
        if (error.message?.includes('users_email_key')) {
            return { success: false, error: 'Email already in use.' }
        }
        return { success: false, error: 'Failed to update credentials.' }
    }
}
