'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Admin client for bypassing RLS to link the profile
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function claimAgentProfile(agentId: string) {
    const cookieStore = await cookies()

    // 1. Verify User Session
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                }
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: 'Unauthorized. Please log in.' }
    }

    if (!user.phone) {
        return { success: false, error: 'No phone number found on your account.' }
    }

    // 2. Fetch Agent Profile to match phone numbers
    // We use the admin client here just in case RLS hides details, 
    // though the agent profile should be public.
    const { data: agent, error: fetchError } = await supabaseAdmin
        .from('contacts')
        .select('phone, id, auth_id, email')
        .eq('id', agentId)
        .single()

    if (fetchError || !agent) {
        return { success: false, error: 'Agent profile not found.' }
    }

    if (agent.auth_id) {
        return { success: false, error: 'This agent profile has already been claimed.' }
    }

    // 3. Compare Phone Numbers
    // Normalize both numbers: remove all non-digits
    const normalize = (p: string) => p.replace(/\D/g, '')
    const userPhone = normalize(user.phone)
    const agentPhone = normalize(agent.phone || '')

    // Check if they match (at least the last 10 digits to be safe against country code variations if needed)
    // Or strict match. Let's do strict match of the normalized string first.
    // If strict match fails, we check if one ends with the other.
    const match = userPhone === agentPhone || (userPhone.length > 8 && agentPhone.endsWith(userPhone)) || (agentPhone.length > 8 && userPhone.endsWith(agentPhone))

    if (!match) {
        return {
            success: false,
            error: `Phone number mismatch. Your account (${user.phone}) does not match the agent profile.`
        }
    }

    // 4. Link Account & Sync Data
    // We update auth_id, is_claimed, and also sync the email if the profile is missing one.
    const updateData: any = {
        auth_id: user.id,
        is_claimed: true, // Explicitly mark as claimed
        updated_at: new Date().toISOString()
    }

    // If the agent profile doesn't have an email, use the account email
    if (!agent.email && user.email) {
        updateData.email = user.email
    }

    const { error: updateError } = await supabaseAdmin
        .from('contacts')
        .update(updateData)
        .eq('id', agentId)

    if (updateError) {
        console.error('Error linking agent profile:', updateError)
        return { success: false, error: 'Failed to update agent profile.' }
    }

    return { success: true }
}
