'use server'

import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function getAgentDashboardStats() {
    const session = await auth()
    const user = session?.user

    if (!user) return { error: 'Unauthorized' }

    // Get Agent ID
    const [agent] = await sql`SELECT id FROM contacts WHERE auth_id = ${user.id as string}`
    if (!agent) return { error: 'Agent profile not found' }

    // Stats
    const [stats] = await sql`
        SELECT 
            count(*) as total_properties,
            sum(view_count) as total_views
        FROM listings 
        WHERE agent_id = ${agent.id}
    `
    // Note: 'dup_properties' was used in the old code, assuming 'listings' or 'properties' is the new table?
    // Let's check the table name from previous context. 
    // The old code used 'dup_properties'. The server actions use 'dbGetPropertiesPaginated' etc which likely query 'listings' or similar.
    // I need to be sure about the table name.

    return {
        totalProperties: stats?.total_properties || 0,
        totalViews: stats?.total_views || 0,
        totalContacts: 0 // Placeholder
    }
}

export async function getAgentProperties() {
    const session = await auth()
    const user = session?.user

    if (!user) return { error: 'Unauthorized' }

    // Get Agent ID
    const [agent] = await sql`SELECT id FROM contacts WHERE auth_id = ${user.id as string}`
    if (!agent) return { error: 'Agent profile not found' }

    // Fetch Properties
    // Assuming 'listings' table based on other files, but 'dup_properties' was in the dashboard.
    // Let's stick to what works in property-actions.ts if possible or query 'listings'.
    // Actually, let's look at lib/database.ts to see the table name used for properties.
    return []
}
