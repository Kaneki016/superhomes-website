import { supabase, Property, Agent } from './supabase'

// Fetch all active properties
export async function getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error)
        return []
    }

    return data || []
}

// Fetch properties with pagination
export async function getPropertiesPaginated(
    page: number = 1,
    limit: number = 12,
    filters?: {
        location?: string
        propertyType?: string
        minPrice?: number
        maxPrice?: number
        bedrooms?: number
    }
): Promise<{
    properties: Property[]
    totalCount: number
    hasMore: boolean
}> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Build base query for count
    let countQuery = supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

    // Build base query for data
    let dataQuery = supabase
        .from('properties')
        .select('*')

    // Apply filters to both queries
    if (filters?.location) {
        countQuery = countQuery.ilike('address', `%${filters.location}%`)
        dataQuery = dataQuery.ilike('address', `%${filters.location}%`)
    }
    if (filters?.propertyType) {
        countQuery = countQuery.ilike('property_type', `%${filters.propertyType}%`)
        dataQuery = dataQuery.ilike('property_type', `%${filters.propertyType}%`)
    }
    if (filters?.minPrice) {
        countQuery = countQuery.gte('price', filters.minPrice)
        dataQuery = dataQuery.gte('price', filters.minPrice)
    }
    if (filters?.maxPrice) {
        countQuery = countQuery.lte('price', filters.maxPrice)
        dataQuery = dataQuery.lte('price', filters.maxPrice)
    }
    if (filters?.bedrooms) {
        countQuery = countQuery.gte('bedrooms', filters.bedrooms)
        dataQuery = dataQuery.gte('bedrooms', filters.bedrooms)
    }

    // Get total count
    const { count, error: countError } = await countQuery

    if (countError) {
        console.error('Error counting properties:', countError)
        return { properties: [], totalCount: 0, hasMore: false }
    }

    // Get paginated data
    const { data, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching properties:', error)
        return { properties: [], totalCount: count || 0, hasMore: false }
    }

    const totalCount = count || 0
    const hasMore = (page * limit) < totalCount

    return {
        properties: data || [],
        totalCount,
        hasMore
    }
}

// Fetch a single property by ID
export async function getPropertyById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching property:', error)
        return null
    }

    return data
}

// Fetch featured properties (first 6)
export async function getFeaturedProperties(): Promise<Property[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6)

    if (error) {
        console.error('Error fetching featured properties:', error)
        return []
    }

    return data || []
}

// Fetch agent by ID
export async function getAgentById(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching agent:', error)
        return null
    }

    return data
}

// NOTE: getAgentByUserId is deprecated - agents from PropertyGuru don't have user_id
// If you need to link agents to users, you'll need a separate mapping table
// export async function getAgentByUserId(userId: string): Promise<Agent | null> {
//     const { data, error } = await supabase
//         .from('agents')
//         .select('*')
//         .eq('user_id', userId)
//         .single()
//
//     if (error) {
//         console.error('Error fetching agent by user:', error)
//         return null
//     }
//
//     return data
// }

// Fetch agent by PropertyGuru agent_id
export async function getAgentByAgentId(agentId: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('agent_id', agentId)
        .single()

    if (error) {
        console.error('Error fetching agent by agent_id:', error)
        return null
    }

    return data
}

// Fetch all agents
export async function getAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching agents:', error)
        return []
    }

    return data || []
}

// Fetch agents with pagination
export async function getAgentsPaginated(page: number = 1, limit: number = 12): Promise<{
    agents: Agent[]
    totalCount: number
    hasMore: boolean
}> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get total count
    const { count, error: countError } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })

    if (countError) {
        console.error('Error counting agents:', countError)
        return { agents: [], totalCount: 0, hasMore: false }
    }

    // Get paginated agents
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('name', { ascending: true })
        .range(from, to)

    if (error) {
        console.error('Error fetching agents:', error)
        return { agents: [], totalCount: count || 0, hasMore: false }
    }

    const totalCount = count || 0
    const hasMore = (page * limit) < totalCount

    return {
        agents: data || [],
        totalCount,
        hasMore
    }
}

// Search properties with filters
export async function searchProperties(filters: {
    location?: string
    propertyType?: string
    minPrice?: number
    maxPrice?: number
    bedrooms?: number
}): Promise<Property[]> {
    let query = supabase
        .from('properties')
        .select('*')

    if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`)
    }

    if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
    }

    if (filters.minPrice) {
        query = query.gte('price', filters.minPrice)
    }

    if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice)
    }

    if (filters.bedrooms) {
        query = query.gte('bedrooms', filters.bedrooms)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
        console.error('Error searching properties:', error)
        return []
    }

    return data || []
}

// Get similar properties (same type, excluding current)
export async function getSimilarProperties(propertyId: string, propertyType: string): Promise<Property[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('property_type', propertyType)
        .neq('id', propertyId)
        .limit(3)

    if (error) {
        console.error('Error fetching similar properties:', error)
        return []
    }

    return data || []
}

// Property types and locations (static for now)
export const propertyTypes = ['Condo', 'Landed', 'Commercial', 'Apartment']
export const locations = [
    'KLCC, Kuala Lumpur',
    'Damansara Heights, Kuala Lumpur',
    'Mont Kiara, Kuala Lumpur',
    'Bangsar, Kuala Lumpur',
    'Setia Alam, Shah Alam',
    'Tropicana, Petaling Jaya',
    'Cyberjaya, Selangor',
    'Putrajaya',
    'Subang Jaya, Selangor',
    'Ampang, Kuala Lumpur',
]

// Get user's favorite properties
export async function getFavoriteProperties(userId: string): Promise<Property[]> {
    // First get the favorite property IDs
    const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', userId)

    if (favError || !favorites || favorites.length === 0) {
        return []
    }

    const propertyIds = favorites.map(f => f.property_id)

    // Then fetch the actual properties
    const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('*')
        .in('id', propertyIds)

    if (propError) {
        console.error('Error fetching favorite properties:', propError)
        return []
    }

    return properties || []
}
