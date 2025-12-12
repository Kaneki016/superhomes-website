import { supabase, Property, Agent } from './supabase'

// Fetch all active properties
export async function getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error)
        return []
    }

    return data || []
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
        .eq('status', 'active')
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

// Fetch agent by user ID
export async function getAgentByUserId(userId: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching agent by user:', error)
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
        .eq('status', 'active')

    if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
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
        .eq('status', 'active')
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
        .eq('status', 'active')

    if (propError) {
        console.error('Error fetching favorite properties:', propError)
        return []
    }

    return properties || []
}
