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
        state?: string // Malaysian state filter
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
        // Simple search on address
        countQuery = countQuery.ilike('address', `%${filters.location}%`)
        dataQuery = dataQuery.ilike('address', `%${filters.location}%`)
    }
    if (filters?.state) {
        countQuery = countQuery.ilike('state', `%${filters.state}%`)
        dataQuery = dataQuery.ilike('state', `%${filters.state}%`)
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
        // Silently return empty if count fails
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

// Fetch properties by a single agent ID with pagination
export async function getPropertiesByAgentId(
    agentId: string,
    page: number = 1,
    limit: number = 12
): Promise<{
    properties: Property[]
    totalCount: number
    hasMore: boolean
}> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Get total count
    const { count, error: countError } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId)

    if (countError) {
        return { properties: [], totalCount: 0, hasMore: false }
    }

    // Get paginated data
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) {
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

// Fetch properties by multiple agent IDs
export async function getPropertiesByAgentIds(agentIds: string[], limit: number = 12): Promise<Property[]> {
    if (!agentIds || agentIds.length === 0) {
        return []
    }

    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('agent_id', agentIds)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
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
        // Silently return null - not found is expected, errors handled by fallback
        return null
    }

    return data
}

// Get distinct states from the database
export async function getDistinctStates(): Promise<string[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('state')
        .not('state', 'is', null)

    if (error) {
        console.error('Error fetching states:', error)
        return []
    }

    // Extract unique values
    const states = data?.map(d => d.state).filter(Boolean) || []
    const uniqueStates = [...new Set(states)]
    return uniqueStates.sort()
}

// Fetch featured properties with optional limit
export async function getFeaturedProperties(limit: number = 8): Promise<Property[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('Error fetching featured properties:', error)
        return []
    }

    return data || []
}

// Fetch diverse properties (one per agent for variety)
export async function getDiverseProperties(limit: number = 8): Promise<Property[]> {
    // Fetch more properties than needed so we can pick unique agents
    const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit * 5) // Fetch more to ensure variety

    if (error) {
        console.error('Error fetching diverse properties:', error)
        return []
    }

    if (!data) return []

    // Pick one property per unique agent
    const seenAgents = new Set<string>()
    const diverseProperties: Property[] = []

    for (const property of data) {
        const agentId = property.agent_id || 'unknown'
        if (!seenAgents.has(agentId) && diverseProperties.length < limit) {
            seenAgents.add(agentId)
            diverseProperties.push(property)
        }
    }

    // If we don't have enough unique agents, fill with remaining properties
    if (diverseProperties.length < limit) {
        for (const property of data) {
            if (!diverseProperties.find(p => p.id === property.id) && diverseProperties.length < limit) {
                diverseProperties.push(property)
            }
        }
    }

    return diverseProperties
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
        // Silently return null - not found is expected
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

// Search agents by name or agency
export async function searchAgents(query: string, limit: number = 5): Promise<Agent[]> {
    if (!query || query.trim().length < 2) {
        return []
    }

    const { data, error } = await supabase
        .from('agents')
        .select('*')
        .or(`name.ilike.%${query}%,agency.ilike.%${query}%`)
        .limit(limit)

    if (error) {
        // Silently return empty if search fails
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

// Get distinct property types from the database
export async function getDistinctPropertyTypes(): Promise<string[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('property_type')
        .not('property_type', 'is', null)

    if (error) {
        console.error('Error fetching property types:', error)
        return []
    }

    // Extract unique values
    const types = data?.map(d => d.property_type).filter(Boolean) || []
    const uniqueTypes = [...new Set(types)]
    return uniqueTypes.sort()
}

// Get distinct locations (extracted from address) from the database
export async function getDistinctLocations(): Promise<string[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('address')
        .not('address', 'is', null)

    if (error) {
        console.error('Error fetching locations:', error)
        return []
    }

    // Extract unique location parts from addresses
    // Typically format is "Area, City, State" - we'll extract the main area/city
    const locationSet = new Set<string>()

    data?.forEach(d => {
        if (d.address) {
            // Split by comma and get meaningful parts
            const parts = d.address.split(',').map((p: string) => p.trim())
            // Add the first part (usually the area/neighborhood)
            if (parts[0]) locationSet.add(parts[0])
            // Add the second part (usually city) if exists
            if (parts[1]) locationSet.add(parts[1])
            // Add state if exists (usually last part)
            if (parts.length > 2 && parts[parts.length - 1]) {
                locationSet.add(parts[parts.length - 1])
            }
        }
    })

    return [...locationSet].sort()
}

// Get distinct bedroom counts from the database
export async function getDistinctBedrooms(): Promise<number[]> {
    const { data, error } = await supabase
        .from('properties')
        .select('bedrooms')
        .not('bedrooms', 'is', null)

    if (error) {
        console.error('Error fetching bedrooms:', error)
        return []
    }

    // Extract unique values
    const bedrooms = data?.map(d => d.bedrooms).filter((b): b is number => b != null && b > 0) || []
    const uniqueBedrooms = [...new Set(bedrooms)]
    return uniqueBedrooms.sort((a, b) => a - b)
}

// Get price range (min and max) from the database
export async function getPriceRange(): Promise<{ min: number; max: number }> {
    const { data, error } = await supabase
        .from('properties')
        .select('price')
        .not('price', 'is', null)
        .order('price', { ascending: true })

    if (error) {
        console.error('Error fetching price range:', error)
        return { min: 0, max: 10000000 }
    }

    if (!data || data.length === 0) {
        return { min: 0, max: 10000000 }
    }

    const prices = data.map(d => d.price).filter((p): p is number => p != null && p > 0)
    return {
        min: Math.min(...prices),
        max: Math.max(...prices)
    }
}

// Get all filter options in one call (more efficient)
export async function getFilterOptions(): Promise<{
    propertyTypes: string[]
    locations: string[]
    bedrooms: number[]
    priceRange: { min: number; max: number }
}> {
    // Fetch all properties once to extract all filter data
    const { data, error } = await supabase
        .from('properties')
        .select('property_type, address, bedrooms, price')

    if (error) {
        console.error('Error fetching filter options:', error)
        return {
            propertyTypes: [],
            locations: [],
            bedrooms: [],
            priceRange: { min: 0, max: 10000000 }
        }
    }

    const propertyTypeSet = new Set<string>()
    const locationSet = new Set<string>()
    const bedroomSet = new Set<number>()
    let minPrice = Infinity
    let maxPrice = 0

    data?.forEach(d => {
        // Property type
        if (d.property_type) propertyTypeSet.add(d.property_type)

        // Location (extract from address)
        if (d.address) {
            const parts = d.address.split(',').map((p: string) => p.trim())
            if (parts[0]) locationSet.add(parts[0])
            if (parts[1]) locationSet.add(parts[1])
        }

        // Bedrooms
        if (d.bedrooms != null && d.bedrooms > 0) bedroomSet.add(d.bedrooms)

        // Price range
        if (d.price != null && d.price > 0) {
            if (d.price < minPrice) minPrice = d.price
            if (d.price > maxPrice) maxPrice = d.price
        }
    })

    return {
        propertyTypes: [...propertyTypeSet].sort(),
        locations: [...locationSet].sort(),
        bedrooms: [...bedroomSet].sort((a, b) => a - b),
        priceRange: {
            min: minPrice === Infinity ? 0 : minPrice,
            max: maxPrice === 0 ? 10000000 : maxPrice
        }
    }
}

// ============================================
// STATISTICS FUNCTIONS FOR DYNAMIC STATS
// ============================================

// Get total property count
export async function getPropertyCount(): Promise<number> {
    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting properties:', error)
        return 0
    }

    return count || 0
}

// Get total agent count
export async function getAgentCount(): Promise<number> {
    const { count, error } = await supabase
        .from('agents')
        .select('*', { count: 'exact', head: true })

    if (error) {
        console.error('Error counting agents:', error)
        return 0
    }

    return count || 0
}

// Get unique cities count
export async function getCitiesCount(): Promise<number> {
    // Try to get city data first
    const { data: cityData, error: cityError } = await supabase
        .from('properties')
        .select('city')
        .not('city', 'is', null)

    // If city column works and has data, use it
    if (!cityError && cityData && cityData.length > 0) {
        const cities = cityData.map(d => d.city).filter(Boolean)
        const uniqueCities = new Set(cities)
        return uniqueCities.size
    }

    // Fallback to state column if city doesn't exist or is empty
    const { data: stateData, error: stateError } = await supabase
        .from('properties')
        .select('state')
        .not('state', 'is', null)

    if (stateError || !stateData) {
        // Silently return 0 if both city and state fail
        return 0
    }

    // Extract unique states
    const states = stateData.map(d => d.state).filter(Boolean)
    const uniqueStates = new Set(states)
    return uniqueStates.size
}

// Get properties added in the last 30 days
export async function getRecentActivityCount(): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count, error } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

    if (error) {
        console.error('Error counting recent properties:', error)
        return 0
    }

    return count || 0
}

// Get all stats in one call (more efficient)
export async function getPlatformStats(): Promise<{
    propertyCount: number
    agentCount: number
    citiesCount: number
    recentListings: number
}> {
    const [propertyCount, agentCount, citiesCount, recentListings] = await Promise.all([
        getPropertyCount(),
        getAgentCount(),
        getCitiesCount(),
        getRecentActivityCount()
    ])

    return {
        propertyCount,
        agentCount,
        citiesCount,
        recentListings
    }
}
