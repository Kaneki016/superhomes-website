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

interface RegisterAgentDetails {
    name: string
    agency: string
    renNumber: string
    email: string
    phone: string
}

export async function registerOrClaimAgent(details: RegisterAgentDetails) {
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
                    // Ignored in server action
                }
            },
        }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, error: 'Unauthorized. Please log in.' }
    }

    // 2. Check for existing agent profile by phone
    // Normalize phone for searching
    // Format: +60123456789
    // But database might have 0123456789 or 6012...
    // Let's use the provided phone which comes from getFormattedPhone (+60...)

    // We search using admin client to bypass RLS
    const { data: existingAgent, error: searchError } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('phone', details.phone)
        .maybeSingle()

    if (searchError) {
        console.error('Error searching for agent:', searchError)
        return { success: false, error: 'Database error while checking profile.' }
    }

    const timestamp = new Date().toISOString()

    try {
        if (existingAgent) {
            // CLAIM EXISTING
            // Check if already claimed by someone else
            if (existingAgent.auth_id && existingAgent.auth_id !== user.id) {
                return { success: false, error: 'This phone number is already linked to another account.' }
            }

            const { error: updateError } = await supabaseAdmin
                .from('contacts')
                .update({
                    auth_id: user.id,
                    contact_type: 'agent',
                    name: details.name, // Allow overwriting name with user preference
                    company_name: details.agency,
                    ren_number: details.renNumber,
                    email: details.email,
                    is_claimed: true,
                    updated_at: timestamp
                })
                .eq('id', existingAgent.id)

            if (updateError) throw updateError

            return { success: true, mode: 'claimed' }

        } else {
            // CREATE NEW
            const photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(details.name)}&background=random`

            const payload = {
                auth_id: user.id,
                contact_type: 'agent',
                name: details.name,
                company_name: details.agency,
                ren_number: details.renNumber,
                email: details.email,
                phone: details.phone,
                is_claimed: true,
                photo_url: photoUrl,
                updated_at: timestamp,
                scraped_at: timestamp
            }

            const { error: insertError } = await supabaseAdmin
                .from('contacts')
                .insert(payload)

            if (insertError) throw insertError

            return { success: true, mode: 'created' }
        }
    } catch (err: any) {
        console.error('Error in registerOrClaimAgent:', err)
        return { success: false, error: err.message || 'Failed to save agent profile.' }
    }
}
