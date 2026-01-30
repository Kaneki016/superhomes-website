'use server'

import { auth } from '@/lib/auth'
import sql from '@/lib/db'
import { slugify } from '@/lib/slugUtils'

export async function claimAgentProfile(agentId: string) {
    const session = await auth()
    const user = session?.user

    if (!user) {
        return { success: false, error: 'Unauthorized. Please log in.' }
    }

    // Fetch user phone from DB to ensure we have it (next-auth session might stick with old data)
    const [dbUser] = await sql`SELECT phone, email FROM users WHERE id = ${user.id as string}`

    if (!dbUser?.phone) {
        return { success: false, error: 'No phone number found on your account.' }
    }

    // 2. Fetch Agent Profile
    const [agent] = await sql`
        SELECT phone, id, auth_id, email, name, company_name, ren_number 
        FROM contacts 
        WHERE id = ${agentId}
    `

    if (!agent) {
        return { success: false, error: 'Agent profile not found.' }
    }

    if (agent.auth_id) {
        return { success: false, error: 'This agent profile has already been claimed.' }
    }

    // 3. Compare Phone Numbers
    const normalize = (p: string) => p.replace(/\D/g, '')
    const userPhone = normalize(dbUser.phone)
    const agentPhone = normalize(agent.phone || '')

    const match = userPhone === agentPhone || (userPhone.length > 8 && agentPhone.endsWith(userPhone)) || (agentPhone.length > 8 && userPhone.endsWith(agentPhone))

    if (!match) {
        return {
            success: false,
            error: `Phone number mismatch. Your account (${dbUser.phone}) does not match the agent profile.`
        }
    }

    // 4. Link Account & Sync Data
    const updates: any = {
        auth_id: user.id,
        is_claimed: true,
        updated_at: new Date()
    }

    if (!agent.email && dbUser.email) {
        updates.email = dbUser.email
    }

    try {
        await sql`
            UPDATE contacts SET ${sql(updates)}
            WHERE id = ${agentId}
        `
        return { success: true }
    } catch (error) {
        console.error('Error linking agent profile:', error)
        return { success: false, error: 'Failed to update agent profile.' }
    }
}

interface RegisterAgentDetails {
    name: string
    agency: string
    renNumber: string
    email: string
    phone: string
}

export async function registerOrClaimAgent(details: RegisterAgentDetails) {
    const session = await auth()
    const user = session?.user

    if (!user) {
        return { success: false, error: 'Unauthorized. Please log in.' }
    }

    // 2. Check for existing agent profile by phone
    const [existingAgent] = await sql`
        SELECT * FROM contacts 
        WHERE phone = ${details.phone}
        LIMIT 1
    `

    const timestamp = new Date()

    try {
        if (existingAgent) {
            // CLAIM EXISTING
            if (existingAgent.auth_id && existingAgent.auth_id !== user.id) {
                return { success: false, error: 'This phone number is already linked to another account.' }
            }

            // Ensure profile_url exists
            let profileUrl = existingAgent.profile_url
            if (!profileUrl) {
                profileUrl = slugify(details.name + '-' + Math.random().toString(36).substring(7))
            }

            await sql`
                UPDATE contacts SET 
                    auth_id = ${user.id as string},
                    contact_type = 'agent',
                    name = ${details.name},
                    company_name = ${details.agency},
                    ren_number = ${details.renNumber},
                    email = ${details.email},
                    is_claimed = true,
                    profile_url = ${profileUrl},
                    updated_at = ${timestamp}
                WHERE id = ${existingAgent.id}
            `

            return { success: true, mode: 'claimed' }

        } else {
            // CREATE NEW
            const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(details.name)}&background=random`
            const profileUrl = slugify(details.name + '-' + Math.random().toString(36).substring(7))

            await sql`
                INSERT INTO contacts (
                    auth_id, contact_type, name, company_name, ren_number, email, phone, is_claimed, photo_url, updated_at, scraped_at, profile_url
                ) VALUES (
                    ${user.id as string}, 'agent', ${details.name}, ${details.agency}, ${details.renNumber}, ${details.email}, ${details.phone}, true, ${photoUrl}, ${timestamp}, ${timestamp}, ${profileUrl}
                )
            `

            return { success: true, mode: 'created' }
        }
    } catch (err: any) {
        console.error('Error in registerOrClaimAgent:', err)
        return { success: false, error: err.message || 'Failed to save agent profile.' }
    }
}
