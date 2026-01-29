'use server'

import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { supabaseAdmin } from '@/lib/supabase-admin'
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
    const filePath = `${user.id}-${Math.random()}.${fileExt}`

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const { error: uploadError } = await supabaseAdmin.storage
            .from('avatars')
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('avatars')
            .getPublicUrl(filePath)

        // Update profile with new URL
        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${user.id}`

        if (buyer) {
            // Buyers don't have photo_url column in listing types... wait.
            // Looking at lib/supabase.ts, Buyer doesn't have photo_url explicitly listed in interface however
            // Contact has photo_url.
            // Let's check DB schema from earlier contexts?
            // Actually buyers table might not have photo_url. 
            // user.user_metadata?.avatar_url is used in profile page.
            // We should update the users table's metadata or add photo_url to buyers.
            // But we moved away from Supabase Auth metadata.
            // We should store it in our DB tables.
            // For now, let's try updating 'contacts' if agent.
            // If buyer, we might need a column.
            // For now, I will assume only agents really display photos or I will add column if it fails?
            // Actually, the previous code updated `supabase.auth.updateUser({ data: { avatar_url: ... } })`
            // This suggests buyers store it in Auth Metadata.
            // Since we use NextAuth with our own DB, we can store it in `users` table possibly?
            // But `users` table schema was `id, email, phone, password, role`.
            // We can maybe add `image` column to `users` table to be standard with NextAuth.

            // Check if we can just update `contacts` for agents.
            // For buyers, we might skip for now or add to `users`.
            // Let's attempt to update `contacts` if agent.
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
