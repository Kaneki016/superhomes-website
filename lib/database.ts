import { supabase, Property, Agent, Transaction, Contact, Listing, ListingSaleDetails, ListingRentDetails, ListingProjectDetails } from './supabase'

// Helper function to transform listing data from Supabase joins to Property type
function transformListingToProperty(listing: any): Property {
    const property: Property = {
        // Base listing fields
        id: listing.id,
        listing_url: listing.listing_url,
        listing_type: listing.listing_type,
        title: listing.title,
        scraped_at: listing.scraped_at,
        updated_at: listing.updated_at,
        created_at: listing.scraped_at, // Use scraped_at as created_at
        description: listing.description,
        address: listing.address,
        district: listing.district,
        state: listing.state,
        postcode: listing.postcode,
        latitude: listing.latitude,
        longitude: listing.longitude,
        property_type: listing.property_type,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        car_parks: listing.car_parks,
        floor_area_sqft: listing.floor_area_sqft,
        land_area_sqft: listing.land_area_sqft,
        images: listing.images,
        furnishing: listing.furnishing,
        is_active: listing.is_active ?? true,
        image_count: listing.image_count,
        main_image_url: listing.main_image_url,
        facilities: listing.facilities,
        listing_id: listing.listing_id,
        total_bedrooms: listing.total_bedrooms,
        bedrooms_main: listing.bedrooms_main,
        bedrooms_additional: listing.bedrooms_additional,

        // Backward compatibility fields
        property_name: listing.title,
        size: listing.floor_area_sqft,
        bedrooms_num: listing.total_bedrooms,
        source: 'propertyguru',
        category: listing.listing_type === 'sale' ? 'buy' :
            listing.listing_type === 'rent' ? 'rent' : 'new_projects',
    }

    // Add type-specific details
    // Note: Supabase returns single objects for one-to-one relationships, arrays for one-to-many
    const saleDetails = Array.isArray(listing.listing_sale_details)
        ? listing.listing_sale_details[0]
        : listing.listing_sale_details
    const rentDetails = Array.isArray(listing.listing_rent_details)
        ? listing.listing_rent_details[0]
        : listing.listing_rent_details
    const projectDetails = Array.isArray(listing.listing_project_details)
        ? listing.listing_project_details[0]
        : listing.listing_project_details

    if (saleDetails && saleDetails.price !== undefined) {
        property.sale_details = saleDetails
        property.price = saleDetails.price
        property.price_per_sqft = saleDetails.price_per_sqft
        property.tenure = saleDetails.tenure
        property.built_year = saleDetails.year_built
        property.listed_date = saleDetails.listing_date
    } else if (rentDetails && rentDetails.monthly_rent !== undefined) {
        property.rent_details = rentDetails
        property.price = rentDetails.monthly_rent // Use monthly_rent as price for display
        property.listed_date = rentDetails.listing_date
    } else if (projectDetails) {
        property.project_details = projectDetails
    }

    // Add contacts
    if (listing.listing_contacts && listing.listing_contacts.length > 0) {
        property.contacts = listing.listing_contacts
            .filter((lc: any) => lc.contacts)
            .map((lc: any) => lc.contacts)

        // Set primary agent_id for backward compatibility
        if (property.contacts && property.contacts.length > 0) {
            property.agent_id = property.contacts[0].id
        }
    }

    return property
}

// Helper function to transform contact to Agent type for backward compatibility
function transformContactToAgent(contact: any): Agent {
    return {
        id: contact.id,
        profile_url: contact.profile_url,
        contact_type: contact.contact_type || 'agent',
        name: contact.name,
        scraped_at: contact.scraped_at,
        updated_at: contact.updated_at,
        phone: contact.phone,
        email: contact.email,
        whatsapp_url: contact.whatsapp_url,
        company_name: contact.company_name,
        company_logo_url: contact.company_logo_url,
        bio: contact.bio,
        agency_reg_no: contact.agency_reg_no,
        photo_url: contact.photo_url,
        ren_number: contact.ren_number,
        listings_for_sale_count: contact.listings_for_sale_count,
        listings_for_rent_count: contact.listings_for_rent_count,
        address: contact.address,
        // Backward compatibility fields
        agent_id: contact.id,
        agency: contact.company_name,
        whatsapp_link: contact.whatsapp_url,
        created_at: contact.scraped_at,
    }
}

// Build the select query with joins for listings
const LISTING_SELECT_QUERY = `
    *,
    listing_sale_details (*),
    listing_rent_details (*),
    listing_project_details (*),
    listing_contacts (
        *,
        contacts (*)
    )
`

// Fetch all active properties
export async function getProperties(): Promise<Property[]> {
    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)
        .order('scraped_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error)
        return []
    }

    return (data || []).map(transformListingToProperty)
}

// Common words to filter out from search queries
const STOPWORDS = new Set([
    'in', 'at', 'on', 'for', 'to', 'with', 'and', 'or', 'the', 'a', 'an',
    'near', 'around', 'by', 'from', 'of', 'is', 'are', 'was', 'were'
])

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
        state?: string
        listingType?: 'sale' | 'rent' | 'project' // New filter for listing type
    }
): Promise<{
    properties: Property[]
    totalCount: number
    hasMore: boolean
}> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // Check if we have a multi-word location search
    const locationQuery = filters?.location?.trim() || ''
    const words = locationQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= 2 && !STOPWORDS.has(word))

    // If we have multi-word search, we need to fetch and filter client-side
    const hasMultiWordSearch = words.length > 1

    if (hasMultiWordSearch) {
        const firstWord = words[0]

        let dataQuery = supabase
            .from('listings')
            .select(LISTING_SELECT_QUERY)
            .eq('is_active', true)
            .or(`title.ilike.%${firstWord}%,address.ilike.%${firstWord}%,state.ilike.%${firstWord}%,property_type.ilike.%${firstWord}%`)

        // Apply filters
        if (filters?.state) {
            dataQuery = dataQuery.ilike('state', `%${filters.state}%`)
        }
        if (filters?.propertyType) {
            dataQuery = dataQuery.ilike('property_type', `%${filters.propertyType}%`)
        }
        if (filters?.listingType) {
            dataQuery = dataQuery.eq('listing_type', filters.listingType)
        }
        if (filters?.bedrooms) {
            dataQuery = dataQuery.eq('total_bedrooms', filters.bedrooms)
        }

        const { data, error } = await dataQuery
            .order('latitude', { ascending: false, nullsFirst: false })
            .order('scraped_at', { ascending: false })
            .limit(500)

        if (error) {
            console.error('Error fetching properties:', error)
            return { properties: [], totalCount: 0, hasMore: false }
        }

        if (!data || data.length === 0) {
            return { properties: [], totalCount: 0, hasMore: false }
        }

        // Transform data
        let properties = data.map(transformListingToProperty)

        // Filter by price if needed (after transformation since price comes from details)
        if (filters?.minPrice) {
            properties = properties.filter(p => (p.price || 0) >= filters.minPrice!)
        }
        if (filters?.maxPrice) {
            properties = properties.filter(p => (p.price || 0) <= filters.maxPrice!)
        }

        // Filter by all keywords
        const filteredResults = properties.filter(property => {
            const combinedText = [
                property.title || '',
                property.property_name || '',
                property.address || '',
                property.state || '',
                property.property_type || ''
            ].join(' ').toLowerCase()

            return words.every(word => combinedText.includes(word))
        })

        const totalCount = filteredResults.length
        const paginatedResults = filteredResults.slice(from, to + 1)
        const hasMore = (page * limit) < totalCount

        return {
            properties: paginatedResults,
            totalCount,
            hasMore
        }
    }

    // Standard single-word or no location search
    // When price filter is active, we need to fetch all matching records first,
    // then filter by price, then paginate (since price is in a related table)
    const hasPriceFilter = filters?.minPrice || filters?.maxPrice

    let dataQuery = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)

    // Apply filters at database level (except price)
    if (filters?.location && words.length === 1) {
        const searchTerm = words[0]
        dataQuery = dataQuery.or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`)
    }
    if (filters?.state) {
        dataQuery = dataQuery.ilike('state', `%${filters.state}%`)
    }
    if (filters?.propertyType) {
        dataQuery = dataQuery.ilike('property_type', `%${filters.propertyType}%`)
    }
    if (filters?.listingType) {
        dataQuery = dataQuery.eq('listing_type', filters.listingType)
    }
    if (filters?.bedrooms) {
        dataQuery = dataQuery.eq('total_bedrooms', filters.bedrooms)
    }

    // If price filter is active, fetch more data and filter/paginate client-side
    if (hasPriceFilter) {
        const { data, error } = await dataQuery
            .order('latitude', { ascending: false, nullsFirst: false })
            .order('scraped_at', { ascending: false })
            .limit(2000) // Fetch more to allow for price filtering

        if (error) {
            console.error('Error fetching properties:', error)
            return { properties: [], totalCount: 0, hasMore: false }
        }

        // Transform data
        let properties = (data || []).map(transformListingToProperty)

        // Filter by price
        if (filters?.minPrice) {
            properties = properties.filter(p => (p.price || 0) >= filters.minPrice!)
        }
        if (filters?.maxPrice) {
            properties = properties.filter(p => (p.price || 0) <= filters.maxPrice!)
        }

        // Paginate the filtered results
        const totalCount = properties.length
        const paginatedResults = properties.slice(from, to + 1)
        const hasMore = (page * limit) < totalCount

        return {
            properties: paginatedResults,
            totalCount,
            hasMore
        }
    }

    // No price filter - use standard pagination at database level
    const countQuery = supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    // Apply same filters to count query
    let countQueryFiltered = countQuery
    if (filters?.location && words.length === 1) {
        const searchTerm = words[0]
        countQueryFiltered = countQueryFiltered.or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`)
    }
    if (filters?.state) {
        countQueryFiltered = countQueryFiltered.ilike('state', `%${filters.state}%`)
    }
    if (filters?.propertyType) {
        countQueryFiltered = countQueryFiltered.ilike('property_type', `%${filters.propertyType}%`)
    }
    if (filters?.listingType) {
        countQueryFiltered = countQueryFiltered.eq('listing_type', filters.listingType)
    }
    if (filters?.bedrooms) {
        countQueryFiltered = countQueryFiltered.eq('total_bedrooms', filters.bedrooms)
    }

    // Get total count
    const { count, error: countError } = await countQueryFiltered

    if (countError) {
        return { properties: [], totalCount: 0, hasMore: false }
    }

    // Get paginated data
    const { data, error } = await dataQuery
        .order('latitude', { ascending: false, nullsFirst: false })
        .order('scraped_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching properties:', error)
        return { properties: [], totalCount: count || 0, hasMore: false }
    }

    const properties = (data || []).map(transformListingToProperty)

    const totalCount = count || 0
    const hasMore = (page * limit) < totalCount

    return {
        properties,
        totalCount,
        hasMore
    }
}


// Fetch properties by a single contact/agent ID with pagination
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

    // First get listing IDs associated with this contact
    const { data: listingContacts, error: lcError } = await supabase
        .from('listing_contacts')
        .select('listing_id')
        .eq('contact_id', agentId)

    if (lcError || !listingContacts || listingContacts.length === 0) {
        return { properties: [], totalCount: 0, hasMore: false }
    }

    const listingIds = listingContacts.map(lc => lc.listing_id)

    // Get total count
    const { count, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .in('id', listingIds)
        .eq('is_active', true)

    if (countError) {
        return { properties: [], totalCount: 0, hasMore: false }
    }

    // Get paginated data
    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .in('id', listingIds)
        .eq('is_active', true)
        .order('scraped_at', { ascending: false })
        .range(from, to)

    if (error) {
        return { properties: [], totalCount: count || 0, hasMore: false }
    }

    const totalCount = count || 0
    const hasMore = (page * limit) < totalCount

    return {
        properties: (data || []).map(transformListingToProperty),
        totalCount,
        hasMore
    }
}

// Fetch properties by multiple agent IDs
export async function getPropertiesByAgentIds(agentIds: string[], limit: number = 12): Promise<Property[]> {
    if (!agentIds || agentIds.length === 0) {
        return []
    }

    // Get listing IDs for all contacts
    const { data: listingContacts, error: lcError } = await supabase
        .from('listing_contacts')
        .select('listing_id')
        .in('contact_id', agentIds)

    if (lcError || !listingContacts || listingContacts.length === 0) {
        return []
    }

    const listingIds = [...new Set(listingContacts.map(lc => lc.listing_id))]

    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .in('id', listingIds)
        .eq('is_active', true)
        .order('scraped_at', { ascending: false })
        .limit(limit)

    if (error) {
        return []
    }

    return (data || []).map(transformListingToProperty)
}

// Fetch a single property by ID
export async function getPropertyById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('id', id)
        .single()

    if (error) {
        return null
    }

    return transformListingToProperty(data)
}

// All Malaysian states and federal territories
const MALAYSIAN_STATES = [
    'Johor',
    'Kedah',
    'Kelantan',
    'Kuala Lumpur',
    'Labuan',
    'Melaka',
    'Negeri Sembilan',
    'Pahang',
    'Penang',
    'Perak',
    'Perlis',
    'Putrajaya',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Terengganu'
]

// Get distinct states from the database
export async function getDistinctStates(): Promise<string[]> {
    // Query for each Malaysian state to see which ones have active listings
    // This avoids the Supabase 1000 row limit issue
    const statesWithListings: string[] = []

    for (const state of MALAYSIAN_STATES) {
        const { count, error } = await supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .ilike('state', state)

        if (!error && count && count > 0) {
            statesWithListings.push(state)
        }
    }

    return statesWithListings.sort()
}

// Fetch featured properties with optional limit (only sale properties with agents)
export async function getFeaturedProperties(limit: number = 8): Promise<Property[]> {
    // Fetch more to account for filtering out properties without agents
    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)
        .eq('listing_type', 'sale')
        .order('scraped_at', { ascending: false })
        .limit(limit * 3)

    if (error) {
        console.error('Error fetching featured properties:', error)
        return []
    }

    // Transform and filter to only include properties with contacts/agents that have valid names
    const properties = (data || []).map(transformListingToProperty)
    const propertiesWithAgents = properties.filter(p => {
        if (!p.contacts || p.contacts.length === 0) return false
        // Filter out properties where the first contact has "Unknown" or empty name
        const agentName = p.contacts[0]?.name?.toLowerCase().trim()
        return agentName && agentName !== 'unknown'
    })

    return propertiesWithAgents.slice(0, limit)
}

// Fetch handpicked properties (Premium/Luxury listings - highest price)
export async function getHandpickedProperties(limit: number = 8, state?: string): Promise<Property[]> {
    // Fetch a pool of recent listings to select from
    let query = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)
        .eq('listing_type', 'sale')

    if (state) {
        query = query.ilike('state', `%${state}%`)
    }

    const { data, error } = await query
        .order('scraped_at', { ascending: false })
        .limit(50) // Fetch 50 candidates

    if (error) {
        console.error('Error fetching handpicked properties:', error)
        return []
    }

    if (!data) return []

    // Transform to properties
    let properties = data.map(transformListingToProperty)

    // Filter to ensure valid data
    properties = properties.filter(p => {
        if (!p.price) return false
        // Ensure valid agent
        if (!p.contacts || p.contacts.length === 0) return false
        const agentName = p.contacts[0]?.name?.toLowerCase().trim()
        return agentName && agentName !== 'unknown'
    })

    // Sort by price descending (Highest Price first) for "Premium" selection
    properties.sort((a, b) => (b.price || 0) - (a.price || 0))

    // Reduce strict agent diversity to allow best properties, but maybe limit 2 per agent?
    // Let's just return the top expensive ones for now as differentiation.

    return properties.slice(0, limit)
}

// Fetch agent/contact by ID
export async function getAgentById(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching agent:', error)
        return null
    }

    return transformContactToAgent(data)
}

// Fetch agent by agent_id (same as id in new schema)
export async function getAgentByAgentId(agentId: string): Promise<Agent | null> {
    return getAgentById(agentId)
}

// Fetch all agents
export async function getAgents(): Promise<Agent[]> {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_type', 'agent')
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching agents:', error)
        return []
    }

    return (data || []).map(transformContactToAgent)
}

// Search agents by name or company
export async function searchAgents(query: string, limit: number = 5): Promise<Agent[]> {
    if (!query || query.trim().length < 2) {
        return []
    }

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_type', 'agent')
        .or(`name.ilike.%${query}%,company_name.ilike.%${query}%`)
        .limit(limit)

    if (error) {
        return []
    }

    return (data || []).map(transformContactToAgent)
}

// Fetch agents with pagination
export async function getAgentsPaginated(page: number = 1, limit: number = 12): Promise<{
    agents: Agent[]
    totalCount: number
    hasMore: boolean
}> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { count, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('contact_type', 'agent')

    if (countError) {
        console.error('Error counting agents:', countError)
        return { agents: [], totalCount: 0, hasMore: false }
    }

    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('contact_type', 'agent')
        .order('name', { ascending: true })
        .range(from, to)

    if (error) {
        console.error('Error fetching agents:', error)
        return { agents: [], totalCount: count || 0, hasMore: false }
    }

    const totalCount = count || 0
    const hasMore = (page * limit) < totalCount

    return {
        agents: (data || []).map(transformContactToAgent),
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
    listingType?: 'sale' | 'rent' | 'project'
}): Promise<Property[]> {
    let query = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)

    if (filters.location) {
        query = query.ilike('address', `%${filters.location}%`)
    }

    if (filters.propertyType) {
        query = query.eq('property_type', filters.propertyType)
    }

    if (filters.listingType) {
        query = query.eq('listing_type', filters.listingType)
    }

    if (filters.bedrooms) {
        query = query.eq('total_bedrooms', filters.bedrooms)
    }

    const { data, error } = await query.order('scraped_at', { ascending: false })

    if (error) {
        console.error('Error searching properties:', error)
        return []
    }

    let properties = (data || []).map(transformListingToProperty)

    // Filter by price after transformation
    if (filters.minPrice) {
        properties = properties.filter(p => (p.price || 0) >= filters.minPrice!)
    }
    if (filters.maxPrice) {
        properties = properties.filter(p => (p.price || 0) <= filters.maxPrice!)
    }

    return properties
}

// Get similar properties
export async function getSimilarProperties(propertyId: string, propertyType: string, state?: string | null): Promise<Property[]> {
    if (state) {
        const { data: sameStateAndType, error: error1 } = await supabase
            .from('listings')
            .select(LISTING_SELECT_QUERY)
            .eq('property_type', propertyType)
            .ilike('state', `%${state}%`)
            .neq('id', propertyId)
            .eq('is_active', true)
            .limit(3)

        if (!error1 && sameStateAndType && sameStateAndType.length >= 3) {
            return sameStateAndType.map(transformListingToProperty)
        }

        const { data: sameState, error: error2 } = await supabase
            .from('listings')
            .select(LISTING_SELECT_QUERY)
            .ilike('state', `%${state}%`)
            .neq('id', propertyId)
            .eq('is_active', true)
            .limit(3)

        if (!error2 && sameState && sameState.length >= 3) {
            return sameState.map(transformListingToProperty)
        }

        // Combine
        const existingIds = new Set((sameState || []).map(p => p.id))
        const needed = 3 - (sameState?.length || 0)

        if (needed > 0) {
            const { data: sameType, error: error3 } = await supabase
                .from('listings')
                .select(LISTING_SELECT_QUERY)
                .eq('property_type', propertyType)
                .neq('id', propertyId)
                .eq('is_active', true)
                .limit(needed + 5)

            if (!error3 && sameType) {
                const additional = sameType.filter(p => !existingIds.has(p.id)).slice(0, needed)
                const combined = [...(sameState || []), ...additional].slice(0, 3)
                return combined.map(transformListingToProperty)
            }
        }

        return (sameState || []).map(transformListingToProperty)
    }

    const { data, error } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('property_type', propertyType)
        .neq('id', propertyId)
        .eq('is_active', true)
        .limit(3)

    if (error) {
        console.error('Error fetching similar properties:', error)
        return []
    }

    return (data || []).map(transformListingToProperty)
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
export async function getFavoriteProperties(buyerId: string): Promise<Property[]> {
    const { data: favorites, error: favError } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('buyer_id', buyerId)

    if (favError || !favorites || favorites.length === 0) {
        return []
    }

    const propertyIds = favorites.map(f => f.property_id)

    const { data: properties, error: propError } = await supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .in('id', propertyIds)

    if (propError) {
        console.error('Error fetching favorite properties:', propError)
        return []
    }

    return (properties || []).map(transformListingToProperty)
}

// Get distinct property types from the database
export async function getDistinctPropertyTypes(): Promise<string[]> {
    const { data, error } = await supabase
        .from('listings')
        .select('property_type')
        .eq('is_active', true)
        .not('property_type', 'is', null)

    if (error) {
        console.error('Error fetching property types:', error)
        return []
    }

    const types = data?.map(d => d.property_type).filter(Boolean) || []
    const uniqueTypes = [...new Set(types)]
    return uniqueTypes.sort()
}

// Get distinct locations
export async function getDistinctLocations(): Promise<string[]> {
    const { data, error } = await supabase
        .from('listings')
        .select('address')
        .eq('is_active', true)
        .not('address', 'is', null)

    if (error) {
        console.error('Error fetching locations:', error)
        return []
    }

    const locationSet = new Set<string>()

    data?.forEach(d => {
        if (d.address) {
            const parts = d.address.split(',').map((p: string) => p.trim())
            if (parts[0]) locationSet.add(parts[0])
            if (parts[1]) locationSet.add(parts[1])
            if (parts.length > 2 && parts[parts.length - 1]) {
                locationSet.add(parts[parts.length - 1])
            }
        }
    })

    return [...locationSet].sort()
}

// Get distinct bedroom counts
export async function getDistinctBedrooms(): Promise<number[]> {
    const { data, error } = await supabase
        .from('listings')
        .select('total_bedrooms')
        .eq('is_active', true)
        .not('total_bedrooms', 'is', null)

    if (error) {
        console.error('Error fetching bedrooms:', error)
        return []
    }

    const bedrooms = data?.map(d => d.total_bedrooms).filter((b): b is number => b != null && b > 0 && b <= 10) || []
    const uniqueBedrooms = [...new Set(bedrooms)]
    return uniqueBedrooms.sort((a, b) => a - b)
}

// Get price range
export async function getPriceRange(): Promise<{ min: number; max: number }> {
    // Get sale prices
    const { data: saleData } = await supabase
        .from('listing_sale_details')
        .select('price')
        .not('price', 'is', null)

    // Get rent prices
    const { data: rentData } = await supabase
        .from('listing_rent_details')
        .select('monthly_rent')
        .not('monthly_rent', 'is', null)

    const salePrices = (saleData || []).map(d => d.price).filter((p): p is number => p != null && p > 0)
    const rentPrices = (rentData || []).map(d => d.monthly_rent).filter((p): p is number => p != null && p > 0)
    const allPrices = [...salePrices, ...rentPrices]

    if (allPrices.length === 0) {
        return { min: 0, max: 10000000 }
    }

    return {
        min: Math.min(...allPrices),
        max: Math.max(...allPrices)
    }
}

// Get all filter options in one call
export async function getFilterOptions(): Promise<{
    propertyTypes: string[]
    locations: string[]
    bedrooms: number[]
    priceRange: { min: number; max: number }
}> {
    const { data, error } = await supabase
        .from('listings')
        .select('property_type, address, total_bedrooms')
        .eq('is_active', true)

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

    data?.forEach(d => {
        if (d.property_type) propertyTypeSet.add(d.property_type)

        if (d.address) {
            const parts = d.address.split(',').map((p: string) => p.trim())
            if (parts[0]) locationSet.add(parts[0])
            if (parts[1]) locationSet.add(parts[1])
        }

        if (d.total_bedrooms != null && d.total_bedrooms > 0 && d.total_bedrooms <= 10) {
            bedroomSet.add(d.total_bedrooms)
        }
    })

    const priceRange = await getPriceRange()

    return {
        propertyTypes: [...propertyTypeSet].sort(),
        locations: [...locationSet].sort(),
        bedrooms: [...bedroomSet].sort((a, b) => a - b),
        priceRange
    }
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

export async function getPropertyCount(): Promise<number> {
    const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

    if (error) {
        console.error('Error counting properties:', error)
        return 0
    }

    return count || 0
}

export async function getAgentCount(): Promise<number> {
    const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('contact_type', 'agent')

    if (error) {
        console.error('Error counting agents:', error)
        return 0
    }

    return count || 0
}

export async function getCitiesCount(): Promise<number> {
    const { data: districtData, error: districtError } = await supabase
        .from('listings')
        .select('district')
        .eq('is_active', true)
        .not('district', 'is', null)

    if (!districtError && districtData && districtData.length > 0) {
        const districts = districtData.map(d => d.district).filter(Boolean)
        const uniqueDistricts = new Set(districts)
        return uniqueDistricts.size
    }

    const { data: stateData, error: stateError } = await supabase
        .from('listings')
        .select('state')
        .eq('is_active', true)
        .not('state', 'is', null)

    if (stateError || !stateData) {
        return 0
    }

    const states = stateData.map(d => d.state).filter(Boolean)
    const uniqueStates = new Set(states)
    return uniqueStates.size
}

export async function getRecentActivityCount(): Promise<number> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .gte('scraped_at', thirtyDaysAgo.toISOString())

    if (error) {
        console.error('Error counting recent properties:', error)
        return 0
    }

    return count || 0
}

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

// Fetch new projects
export async function getNewProjects(filters?: {
    propertyType?: string
    minPrice?: string
    maxPrice?: string
    bedrooms?: string
    state?: string
    tenure?: string
}): Promise<Property[]> {
    let query = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('listing_type', 'project')
        .eq('is_active', true)

    if (filters?.propertyType) {
        query = query.ilike('property_type', `%${filters.propertyType}%`)
    }
    if (filters?.state) {
        query = query.ilike('state', `%${filters.state}%`)
    }
    if (filters?.bedrooms) {
        query = query.eq('total_bedrooms', parseInt(filters.bedrooms))
    }

    const { data, error } = await query.order('scraped_at', { ascending: false })

    if (error) {
        console.error('Error fetching new projects:', error)
        return []
    }

    return (data || []).map(transformListingToProperty)
}

// Search result type for typeahead suggestions
export interface PropertySuggestion {
    id: string
    property_name: string
    address: string
    state: string | null
    property_type: string
    price: number
    listing_type: 'sale' | 'rent' | 'project'
}

// Search properties by keyword for typeahead suggestions
export async function searchPropertiesByKeyword(keyword: string, limit: number = 5): Promise<PropertySuggestion[]> {
    if (!keyword || keyword.trim().length < 2) {
        return []
    }

    const searchTerm = keyword.trim()

    const { data, error } = await supabase
        .from('listings')
        .select(`
            id, title, address, state, property_type, listing_type,
            listing_sale_details (price),
            listing_rent_details (monthly_rent)
        `)
        .eq('is_active', true)
        .or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`)
        .limit(limit)
        .order('scraped_at', { ascending: false })

    if (error) {
        console.error('Error searching properties:', error)
        return []
    }

    return (data || []).map(item => {
        let price = 0
        if (item.listing_sale_details && item.listing_sale_details.length > 0) {
            price = item.listing_sale_details[0].price || 0
        } else if (item.listing_rent_details && item.listing_rent_details.length > 0) {
            price = item.listing_rent_details[0].monthly_rent || 0
        }

        return {
            id: item.id,
            property_name: item.title,
            address: item.address || '',
            state: item.state,
            property_type: item.property_type || '',
            price,
            listing_type: item.listing_type
        }
    })
}

// Fetch rent listings
export async function getRentListings(filters?: {
    propertyType?: string
    minPrice?: string
    maxPrice?: string
    bedrooms?: string
    state?: string
    furnishing?: string
}): Promise<Property[]> {
    let query = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('listing_type', 'rent')
        .eq('is_active', true)

    if (filters?.propertyType) {
        query = query.ilike('property_type', `%${filters.propertyType}%`)
    }
    if (filters?.state) {
        query = query.ilike('state', `%${filters.state}%`)
    }
    if (filters?.bedrooms) {
        query = query.eq('total_bedrooms', parseInt(filters.bedrooms))
    }
    if (filters?.furnishing) {
        query = query.ilike('furnishing', `%${filters.furnishing}%`)
    }

    const { data, error } = await query.order('scraped_at', { ascending: false })

    if (error) {
        console.error('Error fetching rent listings:', error)
        return []
    }

    // Filter by price range on the rent details
    let results = (data || []).map(transformListingToProperty)

    if (filters?.minPrice || filters?.maxPrice) {
        results = results.filter(p => {
            const price = p.price || 0
            const min = filters.minPrice ? parseInt(filters.minPrice) : 0
            const max = filters.maxPrice ? parseInt(filters.maxPrice) : Infinity
            return price >= min && price <= max
        })
    }

    return results
}

// ============================================
// DEPRECATED - OLD FUNCTIONS (Commented for reference)
// ============================================

/*
// OLD: Fetch all active properties from dup_properties
export async function getProperties_OLD(): Promise<Property[]> {
    const { data, error } = await supabase
        .from('dup_properties')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching properties:', error)
        return []
    }

    return data || []
}

// OLD: Fetch agent by ID from dup_agents
export async function getAgentById_OLD(id: string): Promise<Agent | null> {
    const { data, error } = await supabase
        .from('dup_agents')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching agent:', error)
        return null
    }

    return data
}
*/

// ============================================
// TRANSACTION DATA FUNCTIONS
// ============================================

// Fetch recent transactions with pagination
export async function getTransactions(
    page: number = 1,
    limit: number = 500,
    filters?: {
        neighborhood?: string
        minPrice?: number
        maxPrice?: number
        propertyType?: string[]
        tenure?: string[]
        searchQuery?: string
        minYear?: number
        maxYear?: number
        bounds?: {
            minLat: number
            maxLat: number
            minLng: number
            maxLng: number
        }
    }
): Promise<Transaction[]> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
        .from('transactions')
        .select('id, price, transaction_date, address, district, neighborhood, latitude, longitude, property_type, tenure, built_up_sqft, land_area_sqft, unit_level')
        // Only fetch valid coordinates for the map
        .not('latitude', 'is', null)
        .neq('latitude', -99)

    // Bounding Box Filter (Viewport Optimization)
    if (filters?.bounds) {
        query = query.gte('latitude', filters.bounds.minLat)
            .lte('latitude', filters.bounds.maxLat)
            .gte('longitude', filters.bounds.minLng)
            .lte('longitude', filters.bounds.maxLng)
    }

    if (filters?.neighborhood) {
        query = query.eq('neighborhood', filters.neighborhood)
    }

    if (filters?.minYear) {
        query = query.gte('transaction_date', `${filters.minYear}-01-01`)
    }

    if (filters?.maxYear) {
        query = query.lte('transaction_date', `${filters.maxYear}-12-31`)
    }

    if (filters?.searchQuery) {
        // Search across address, neighborhood, and district
        query = query.or(`address.ilike.%${filters.searchQuery}%,neighborhood.ilike.%${filters.searchQuery}%,district.ilike.%${filters.searchQuery}%`)
    }

    if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice)
    }

    if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice)
    }

    if (filters?.propertyType && filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType)
    }

    if (filters?.tenure && filters.tenure.length > 0) {
        query = query.in('tenure', filters.tenure)
    }

    // Optimization: When searching, disable sort and reduce limit to prevent timeouts
    const isSearching = !!filters?.searchQuery
    const effectiveLimit = isSearching ? 100 : limit
    const activeTo = from + effectiveLimit - 1

    let finalQuery = query

    // Only sort if NOT searching (searching requires full table scan for sort, causing timeout)
    if (!isSearching) {
        finalQuery = finalQuery.order('transaction_date', { ascending: false })
    }

    const { data, error } = await finalQuery
        .range(from, activeTo)

    if (error) {
        console.error('Error fetching transactions:', error.message || error)
        console.error('Error details:', error)
        return []
    }

    return (data as any) || []
}

// Get distinct neighborhoods for filtering
export async function getDistinctNeighborhoods(): Promise<string[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('neighborhood')
        .not('neighborhood', 'is', null)

    if (error) {
        console.error('Error fetching neighborhoods:', error)
        return []
    }

    const neighborhoods = data.map(d => d.neighborhood).filter(Boolean) as string[]
    return [...new Set(neighborhoods)].sort()
}

// Get distinct property types
export async function getTransactionPropertyTypes(): Promise<string[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('property_type')
        .not('property_type', 'is', null)

    if (error) {
        console.error('Error fetching property types:', error)
        return []
    }

    const types = data.map(d => d.property_type).filter(Boolean) as string[]
    return [...new Set(types)].sort()
}

// Get distinct tenures
export async function getTransactionTenures(): Promise<string[]> {
    const { data, error } = await supabase
        .from('transactions')
        .select('tenure')
        .not('tenure', 'is', null)

    if (error) {
        console.error('Error fetching tenures:', error)
        return []
    }


    const tenures = data.map(d => d.tenure).filter(Boolean) as string[]
    return [...new Set(tenures)].sort()
}

// Get metrics for transactions (overall or filtered)
export async function getTransactionMetrics(filters?: {
    neighborhood?: string
    minPrice?: number
    maxPrice?: number
    propertyType?: string[]
    tenure?: string[]
    searchQuery?: string
}): Promise<{
    avgPrice: number
    avgPsf: number
    totalTransactions: number
    minPrice: number
    maxPrice: number
}> {
    let query = supabase
        .from('transactions')
        .select('price, built_up_sqft')
        .not('price', 'is', null) // Ensure price exists

    if (filters?.neighborhood) {
        query = query.eq('neighborhood', filters.neighborhood)
    }

    if (filters?.searchQuery) {
        query = query.ilike('address', `%${filters.searchQuery}%`)
    }

    if (filters?.minPrice) {
        query = query.gte('price', filters.minPrice)
    }

    if (filters?.maxPrice) {
        query = query.lte('price', filters.maxPrice)
    }

    if (filters?.propertyType && filters.propertyType.length > 0) {
        query = query.in('property_type', filters.propertyType)
    }

    if (filters?.tenure && filters.tenure.length > 0) {
        query = query.in('tenure', filters.tenure)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching metrics:', error)
        return {
            avgPrice: 0,
            avgPsf: 0,
            totalTransactions: 0,
            minPrice: 0,
            maxPrice: 0
        }
    }

    if (!data || data.length === 0) {
        return {
            avgPrice: 0,
            avgPsf: 0,
            totalTransactions: 0,
            minPrice: 0,
            maxPrice: 0
        }
    }

    // Calculate metrics
    const totalTransactions = data.length
    const totalPrice = data.reduce((sum, t) => sum + (t.price || 0), 0)
    const avgPrice = totalPrice / totalTransactions

    const prices = data.map(t => t.price).sort((a, b) => a - b)
    const minPrice = prices[0]
    const maxPrice = prices[prices.length - 1]

    // Calculate avg PSF (only for records with sqft)
    const validSqftData = data.filter(t => t.built_up_sqft && t.built_up_sqft > 0)
    let avgPsf = 0
    if (validSqftData.length > 0) {
        const totalPsf = validSqftData.reduce((sum, t) => sum + (t.price / t.built_up_sqft), 0)
        avgPsf = totalPsf / validSqftData.length
    }

    return {
        avgPrice,
        avgPsf,
        totalTransactions,
        minPrice,
        maxPrice
    }
}
