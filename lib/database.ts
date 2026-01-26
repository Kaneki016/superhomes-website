import { supabase, Property, Agent, Transaction, Contact, Listing, ListingSaleDetails, ListingRentDetails, ListingProjectDetails } from './supabase'
import { extractSearchTermsFromSlug, extractIdFromSlug } from './slugUtils'

// Simple in-memory cache for frequently accessed data
interface CacheEntry<T> {
    data: T
    expiry: number
}

const cache: Record<string, CacheEntry<any>> = {}

function getCached<T>(key: string): T | null {
    const entry = cache[key]
    if (!entry) return null
    if (Date.now() > entry.expiry) {
        delete cache[key]
        return null
    }
    return entry.data
}

function setCache<T>(key: string, data: T, ttlSeconds: number = 300): void {
    cache[key] = {
        data,
        expiry: Date.now() + (ttlSeconds * 1000)
    }
}

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

    // Prioritize details based on listing_type
    if (listing.listing_type === 'project' && projectDetails) {
        property.project_details = projectDetails
        const rawPrice = projectDetails.price || projectDetails.min_price

        if (typeof rawPrice === 'number') {
            property.price = rawPrice
        } else if (typeof rawPrice === 'string') {
            const cleaned = rawPrice.replace(/[^0-9.]/g, '')
            const parsed = parseFloat(cleaned)
            property.price = isNaN(parsed) ? null : parsed
        } else {
            property.price = null
        }


        if (projectDetails.tenure) property.tenure = projectDetails.tenure

        // Use project-specific main image if available
        if (projectDetails.main_image_url) {
            property.main_image_url = projectDetails.main_image_url
        }
    } else if (listing.listing_type === 'sale' && saleDetails && saleDetails.price !== undefined) {
        property.sale_details = saleDetails
        property.price = saleDetails.price
        property.price_per_sqft = saleDetails.price_per_sqft
        property.tenure = saleDetails.tenure
        property.built_year = saleDetails.year_built
        property.listed_date = saleDetails.listing_date
    } else if (listing.listing_type === 'rent' && rentDetails && rentDetails.monthly_rent !== undefined) {
        property.rent_details = rentDetails
        property.property_type = property.property_type || 'Rental' // Ensure type is set
        property.price = rentDetails.monthly_rent // Use monthly_rent as price for display
        property.listed_date = rentDetails.listing_date
    } else {
        // Fallback for mixed/legacy data
        if (saleDetails && saleDetails.price !== undefined) {
            property.sale_details = saleDetails
            property.price = saleDetails.price
            property.tenure = saleDetails.tenure
        } else if (rentDetails && rentDetails.monthly_rent !== undefined) {
            property.rent_details = rentDetails
            property.price = rentDetails.monthly_rent
        } else if (projectDetails) {
            property.project_details = projectDetails
            const rawPrice = projectDetails.price || projectDetails.min_price

            if (typeof rawPrice === 'number') {
                property.price = rawPrice
            } else if (typeof rawPrice === 'string') {
                const cleaned = rawPrice.replace(/[^0-9.]/g, '')
                const parsed = parseFloat(cleaned)
                property.price = isNaN(parsed) ? null : parsed
            }
        }
    }                // Add contacts
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
        listingType?: 'sale' | 'rent' | 'project'
        tenure?: string
    },
    prioritizeStates: boolean = false
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
            .limit(5000)

        if (error) {
            console.error('Error fetching properties:', error)
            return { properties: [], totalCount: 0, hasMore: false }
        }

        if (!data || data.length === 0) {
            return { properties: [], totalCount: 0, hasMore: false }
        }

        // Transform data
        let properties = data.map(transformListingToProperty)

        // Filter by price if needed
        if (filters?.minPrice) {
            properties = properties.filter(p => (p.price || 0) >= filters.minPrice!)
        }
        if (filters?.maxPrice) {
            properties = properties.filter(p => (p.price || 0) <= filters.maxPrice!)
        }
        // Filter by tenure
        if (filters?.tenure) {
            properties = properties.filter(p => p.tenure && p.tenure.toLowerCase().includes(filters.tenure!.toLowerCase()))
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
    // When price or tenure filter is active, we need to fetch all matching records first,
    // then filter client-side (since these fields might be in related tables)
    const hasPostFilter = filters?.minPrice || filters?.maxPrice || filters?.tenure

    let dataQuery = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)

    // Apply filters at database level
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

    // If post-fetch filter is active, fetch more data and filter/paginate client-side
    if (hasPostFilter) {
        const { data, error } = await dataQuery
            .order('scraped_at', { ascending: false })
            .limit(5000) // Increase limit to capture more candidates

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
        // Filter by tenure
        if (filters?.tenure) {
            properties = properties.filter(p => p.tenure && p.tenure.toLowerCase().includes(filters.tenure!.toLowerCase()))
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

    // standard pagination
    const countQuery = supabase
        .from('listings')
        .select('*', { count: 'estimated', head: true })
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
        .order('scraped_at', { ascending: false })
        .range(from, to)

    if (error) {
        console.error('Error fetching properties:', error)
        return { properties: [], totalCount: count || 0, hasMore: false }
    }

    let properties = (data || []).map(transformListingToProperty)

    // Apply priority state sorting if requested and no state filter is active
    if (prioritizeStates && !filters?.state) {
        properties = properties.sort((a, b) => {
            const aIsPriority = a.state ? PRIORITY_STATES.includes(a.state) : false
            const bIsPriority = b.state ? PRIORITY_STATES.includes(b.state) : false

            // Priority states first
            if (aIsPriority && !bIsPriority) return -1
            if (!aIsPriority && bIsPriority) return 1

            // Within same priority level, sort by date (newest first)
            const aDate = new Date(a.scraped_at || 0).getTime()
            const bDate = new Date(b.scraped_at || 0).getTime()
            return bDate - aDate
        })
    }

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

// Optimized property fetch using slug (Title Search + Short ID Check)
// This is much faster than getPropertyByShortId because it uses the Title to filter via ILIKE (indexed-ish)
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
    const shortId = extractIdFromSlug(slug)
    const searchTerms = extractSearchTermsFromSlug(slug)

    // Strategy 1: Try finding by Title + Short ID match (Fastest)
    if (searchTerms && searchTerms.length > 2) {
        // Create a specific pattern from all valid terms (e.g. "leisure farm" -> "%leisure%farm%")
        const tokens = searchTerms.split(' ').filter(t => t.length > 2 && !STOPWORDS.has(t.toLowerCase()))

        if (tokens.length > 0) {
            const pattern = `%${tokens.join('%')}%`

            const { data, error } = await supabase
                .from('listings')
                .select('id') // Fetch IDs only
                .ilike('title', pattern)
                .limit(1000) // 1000 IDs is lightweight (~30KB), covers almost all name collisions

            if (!error && data && data.length > 0) {
                // Check for ID match
                const match = data.find((item: any) =>
                    item.id && item.id.toLowerCase().endsWith(shortId.toLowerCase())
                )

                if (match) {
                    return getPropertyById(match.id)
                }
            }
        }
    }

    // Strategy 2: Fallback to slow scan if title mismatch (e.g. title changed)
    return getPropertyByShortId(shortId)
}

// Fetch a property by the last 8 characters of its ID (for SEO-friendly slug URLs)
// Uses a two-step approach: fetch only IDs first (lightweight), then fetch full property by UUID
export async function getPropertyByShortId(shortId: string): Promise<Property | null> {
    if (!shortId || shortId.length < 6) {
        console.log('Invalid short ID:', shortId)
        return null
    }

    const shortIdLower = shortId.toLowerCase()

    // Step 1: Fetch only IDs (very lightweight - no joins, minimal data)
    // Supabase default limit is 1000 rows, so we use that as our page size
    let matchedId: string | null = null
    let page = 0
    const pageSize = 1000

    while (!matchedId) {
        const { data, error } = await supabase
            .from('listings')
            .select('id')
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
            console.error('Error fetching property IDs:', error)
            break
        }

        if (!data || data.length === 0) {
            break
        }

        // Find matching ID in this batch
        const match = data.find((item: { id: string }) =>
            item.id && item.id.toLowerCase().endsWith(shortIdLower)
        )

        if (match) {
            matchedId = match.id
            break
        }

        // If we got less than pageSize, we've reached the end
        if (data.length < pageSize) {
            break
        }

        page++

        // Safety limit (50 pages * 1000 = 50,000 properties max)
        if (page > 50) {
            console.log('Reached pagination limit while searching for short ID')
            break
        }
    }

    if (!matchedId) {
        console.log('No property found with short ID:', shortId)
        return null
    }

    // Step 2: Fetch the full property by exact UUID (single record, with all joins)
    console.log('Found matching UUID:', matchedId, 'for short ID:', shortId)
    return getPropertyById(matchedId)
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

// Get distinct states from the database (cached for 5 minutes)
export async function getDistinctStates(): Promise<string[]> {
    // Check cache first
    const cached = getCached<string[]>('distinct_states')
    if (cached) return cached

    // Query all states in parallel instead of sequentially
    const statePromises = MALAYSIAN_STATES.map(async (state) => {
        const { count, error } = await supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true)
            .ilike('state', state)

        return (!error && count && count > 0) ? state : null
    })

    const results = await Promise.all(statePromises)
    const statesWithListings = results.filter((s): s is string => s !== null).sort()

    // Cache for 5 minutes
    setCache('distinct_states', statesWithListings, 300)

    return statesWithListings
}

// Fetch featured properties with optional limit (only sale properties with agents)
// Cached for 2 minutes (only if we get results)
export async function getFeaturedProperties(limit: number = 8): Promise<Property[]> {
    const cacheKey = `featured_properties_${limit}`
    const cached = getCached<Property[]>(cacheKey)
    if (cached && cached.length > 0) return cached

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

    const result = propertiesWithAgents.slice(0, limit)

    // Only cache if we got results
    if (result.length > 0) {
        setCache(cacheKey, result, 120)
    }

    return result
}

// Fetch handpicked properties (Premium/Luxury listings - highest price)
// Now supports dynamic filtering to be "Handpicked for You" based on preferences
export async function getHandpickedProperties(
    limit: number = 8,
    state?: string,
    filters?: {
        propertyType?: string
        minPrice?: string
        maxPrice?: string
        bedrooms?: string
    }
): Promise<Property[]> {
    // Fetch a pool of recent listings to select from
    let query = supabase
        .from('listings')
        .select(LISTING_SELECT_QUERY)
        .eq('is_active', true)
        .eq('listing_type', 'sale')

    // Apply Filters
    if (state) {
        query = query.ilike('state', `%${state}%`)
    }
    if (filters?.propertyType) {
        query = query.ilike('property_type', `%${filters.propertyType}%`)
    }
    if (filters?.bedrooms && filters.bedrooms !== '') {
        query = query.eq('total_bedrooms', filters.bedrooms)
    }

    // Note: Price filtering happens AFTER transformation because it's in a joined table logic
    // But we sort by price descending anyway, so we just filter the results

    const { data, error } = await query
        .order('scraped_at', { ascending: false })
        .limit(100) // Increase fetch pool to ensure we have enough after filtering

    if (error) {
        console.error('Error fetching handpicked properties:', error)
        return []
    }

    if (!data) return []

    // Transform to properties
    let properties = data.map(transformListingToProperty)

    // Filter to ensure valid data and apply price limits
    properties = properties.filter(p => {
        // Basic validity
        if (!p.price) return false
        if (!p.contacts || p.contacts.length === 0) return false
        const agentName = p.contacts[0]?.name?.toLowerCase().trim()
        if (!agentName || agentName === 'unknown') return false

        // Price Filter
        if (filters?.minPrice && p.price < parseInt(filters.minPrice)) return false
        if (filters?.maxPrice && p.price > parseInt(filters.maxPrice)) return false

        return true
    })

    // Sort by price descending (Highest Price first) for "Premium" selection
    properties.sort((a, b) => (b.price || 0) - (a.price || 0))

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

    // Transform contacts to agents
    const agents = (data || []).map(transformContactToAgent)

    // Enrich with dynamic listing counts
    return enrichAgentsWithListingCounts(agents)
}

/**
 * Enrich agents with dynamic listing counts from the database
 * Calculates actual sale/rent counts from active listings
 * @param agents - Array of agents to enrich
 * @param state - Optional state filter for counting only listings in specific state
 */
async function enrichAgentsWithListingCounts(agents: Agent[], state?: string): Promise<Agent[]> {
    if (agents.length === 0) return agents

    const enrichedAgents = await Promise.all(
        agents.map(async (agent) => {
            try {
                // Get all listing IDs for this agent
                const { data: listingContacts } = await supabase
                    .from('listing_contacts')
                    .select('listing_id')
                    .eq('contact_id', agent.id)

                if (!listingContacts || listingContacts.length === 0) {
                    return {
                        ...agent,
                        listings_for_sale_count: 0,
                        listings_for_rent_count: 0
                    }
                }

                const listingIds = listingContacts.map(lc => lc.listing_id)

                // Get active listings and their types
                let listingsQuery = supabase
                    .from('listings')
                    .select('listing_type, state')
                    .in('id', listingIds)
                    .eq('is_active', true)

                // Filter by state if provided
                if (state) {
                    listingsQuery = listingsQuery.ilike('state', `%${state}%`)
                }

                const { data: listings } = await listingsQuery

                const saleCount = listings?.filter(l => l.listing_type === 'sale').length || 0
                const rentCount = listings?.filter(l => l.listing_type === 'rent').length || 0

                return {
                    ...agent,
                    listings_for_sale_count: saleCount,
                    listings_for_rent_count: rentCount
                }
            } catch (error) {
                console.error(`Error enriching agent ${agent.id}:`, error)
                // Return agent with zero counts on error
                return {
                    ...agent,
                    listings_for_sale_count: 0,
                    listings_for_rent_count: 0
                }
            }
        })
    )

    return enrichedAgents
}

// Priority states for default agent ranking
const PRIORITY_STATES = ['Kuala Lumpur', 'Selangor', 'Johor', 'Penang']

// Fetch agents with pagination, optionally filtered by state
export async function getAgentsPaginated(
    page: number = 1,
    limit: number = 12,
    state?: string
): Promise<{
    agents: Agent[]
    totalCount: number
    hasMore: boolean
}> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    // If a specific state is selected, filter and rank by that state
    if (state) {
        // Get all active listings in the selected state with their agents
        const { data: stateListings, error: listingsError } = await supabase
            .from('listings')
            .select('id, listing_type, state, listing_contacts(contact_id)')
            .eq('is_active', true)
            .ilike('state', `%${state}%`)

        if (listingsError) {
            console.error('Error fetching state listings:', listingsError)
            return { agents: [], totalCount: 0, hasMore: false }
        }

        // Group by contact_id and count listings
        const agentCounts = new Map<string, { sale: number, rent: number, total: number }>()

        stateListings?.forEach((listing: any) => {
            const contactId = listing.listing_contacts?.[0]?.contact_id
            if (!contactId) return

            const counts = agentCounts.get(contactId) || { sale: 0, rent: 0, total: 0 }
            if (listing.listing_type === 'sale') counts.sale++
            if (listing.listing_type === 'rent') counts.rent++
            counts.total++
            agentCounts.set(contactId, counts)
        })

        // Sort agent IDs by total listing count (descending)
        const sortedAgentIds = Array.from(agentCounts.entries())
            .sort((a, b) => b[1].total - a[1].total)
            .map(([id]) => id)

        const totalCount = sortedAgentIds.length
        const hasMore = (page * limit) < totalCount

        // Paginate the sorted agent IDs
        const paginatedIds = sortedAgentIds.slice(from, to + 1)

        if (paginatedIds.length === 0) {
            return { agents: [], totalCount: 0, hasMore: false }
        }

        // Fetch agent details for the paginated IDs
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .in('id', paginatedIds)
            .eq('contact_type', 'agent')

        if (error) {
            console.error('Error fetching agents:', error)
            return { agents: [], totalCount, hasMore: false }
        }

        // Transform and maintain sort order
        const agentsMap = new Map(
            (data || []).map(contact => [contact.id, transformContactToAgent(contact)])
        )

        const agents = paginatedIds
            .map(id => agentsMap.get(id))
            .filter((agent): agent is Agent => agent !== undefined)

        // Enrich with state-specific listing counts
        const enrichedAgents = agents.map(agent => {
            const counts = agentCounts.get(agent.id)
            return {
                ...agent,
                listings_for_sale_count: counts?.sale || 0,
                listings_for_rent_count: counts?.rent || 0
            }
        })

        return {
            agents: enrichedAgents,
            totalCount,
            hasMore
        }
    }

    // No state selected: Show ALL agents with optimized fetching
    // Strategy:
    // 1. Get total count of agents (fast)
    // 2. Fetch all listing-agent relationships to identify active agents and their stats (lightweight)
    // 3. Sort active agents by stats
    // 4. If current page is within active agents range, use sorted active agents
    // 5. If current page needs inactive agents, fetch them via offset

    // 1. Get total count (fast)
    const { count: totalAgentCount, error: countError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('contact_type', 'agent')

    if (countError) {
        console.error('Error counting agents:', countError)
        return { agents: [], totalCount: 0, hasMore: false }
    }

    // 2. Fetch all active listing relationships to rank agents (lightweight - only IDs)
    // This allows us to sort by performance without fetching full profiles
    const { data: listingContacts, error: lcError } = await supabase
        .from('listing_contacts')
        .select('contact_id, listings!inner(listing_type, state, is_active)')
        .eq('listings.is_active', true)

    if (lcError) {
        console.error('Error fetching listing contacts:', lcError)
        // Fallback to simple pagination if optimization fails
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('contact_type', 'agent')
            .range(from, to)
        return { agents: (data || []).map(transformContactToAgent), totalCount: totalAgentCount || 0, hasMore: false }
    }

    // 3. Aggregate stats for active agents
    const agentStats = new Map<string, { sale: number, rent: number, total: number, priorityCount: number }>()

    listingContacts?.forEach((lc: any) => {
        const contactId = lc.contact_id
        const listing = lc.listings

        if (!contactId || !listing) return

        const stats = agentStats.get(contactId) || { sale: 0, rent: 0, total: 0, priorityCount: 0 }

        if (listing.listing_type === 'sale') stats.sale++
        if (listing.listing_type === 'rent') stats.rent++
        stats.total++

        // Check priority state
        const listingState = listing.state?.toLowerCase() || ''
        const isPriority = PRIORITY_STATES.some(ps => listingState.includes(ps.toLowerCase()))
        if (isPriority) stats.priorityCount++

        agentStats.set(contactId, stats)
    })

    // Sort active agent IDs by performance
    const activeAgentIds = Array.from(agentStats.entries())
        .sort((a, b) => {
            // Priority 1: Priority state listings
            const aHasPriority = a[1].priorityCount > 0
            const bHasPriority = b[1].priorityCount > 0
            if (aHasPriority && !bHasPriority) return -1
            if (!aHasPriority && bHasPriority) return 1
            if (aHasPriority && bHasPriority) return b[1].priorityCount - a[1].priorityCount

            // Priority 2: Total listings
            return b[1].total - a[1].total
        })
        .map(([id]) => id)

    // 4. Determine which agents to show for current page
    let targetIds: string[] = []
    const totalActive = activeAgentIds.length

    if (from < totalActive) {
        // Page includes active agents
        targetIds = activeAgentIds.slice(from, to + 1)
    }

    // If page needs more agents (inactive ones), fetch them
    const slotsFilled = targetIds.length
    const slotsNeeded = limit - slotsFilled

    if (slotsNeeded > 0) {
        // Calculate offset for inactive agents
        // If we exhausted active agents in previous pages, offset is (from - totalActive)
        // If we partially used active agents on this page, offset is 0 for inactive fetch
        const inactiveOffset = Math.max(0, from - totalActive)

        // Fetch inactive agents (those NOT in activeAgentIds)
        // Note: 'not.in' with 6000 IDs might be slow, but active agents are usually fewer (~few hundreds/thousands)
        // Optimized: Fetch page of agents, then filter out active ones? No, that breaks pagination consistency.
        // Better: Since we only need IDs, we can fetch IDs and filter in DB if list is small, or use 'not.in'

        // For performance with large datasets, we'll just fetch agents normally and exclude active ones
        // But simpler approach for now to handle "stuck loading":
        // Just fetch sorted by name for the rest

        const { data: inactiveCandidates, error: inactiveError } = await supabase
            .from('contacts')
            .select('id')
            .eq('contact_type', 'agent')
            .not('id', 'in', `(${activeAgentIds.join(',')})`) // Exclude already ranked agents
            .order('name', { ascending: true })
            .range(inactiveOffset, inactiveOffset + slotsNeeded - 1)

        if (!inactiveError && inactiveCandidates) {
            targetIds.push(...inactiveCandidates.map(c => c.id))
        }
    }

    if (targetIds.length === 0) {
        return { agents: [], totalCount: totalAgentCount || 0, hasMore: false }
    }

    // 5. Fetch full details for the target IDs
    const { data: agentsData, error: agentsDataError } = await supabase
        .from('contacts')
        .select('*')
        .in('id', targetIds)
        .eq('contact_type', 'agent')

    if (agentsDataError) {
        console.error('Error fetching agent details:', agentsDataError)
        return { agents: [], totalCount: totalAgentCount || 0, hasMore: false }
    }

    // Transform and Re-sort (because .in() does not preserve order)
    const agentsMap = new Map(
        (agentsData || []).map(contact => [contact.id, transformContactToAgent(contact)])
    )

    const orderedAgents = targetIds
        .map(id => agentsMap.get(id))
        .filter((agent): agent is Agent => agent !== undefined)

    // Enrich with stats
    const enrichedAgents = orderedAgents.map(agent => {
        const stats = agentStats.get(agent.id)
        return {
            ...agent,
            listings_for_sale_count: stats?.sale || 0,
            listings_for_rent_count: stats?.rent || 0
        }
    })

    return {
        agents: enrichedAgents,
        totalCount: totalAgentCount || 0,
        hasMore: (page * limit) < (totalAgentCount || 0)
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

    const { data, error } = await query.order('scraped_at', { ascending: false }).limit(500)

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
export async function getSimilarProperties(propertyId: string, propertyType: string, state?: string | null, listingType?: string, district?: string | null): Promise<Property[]> {
    let similarProps: any[] = []
    const LIMIT = 3

    // 1. Strict Match: District + Property Type + Listing Type
    if (district) {
        let query1 = supabase
            .from('listings')
            .select(LISTING_SELECT_QUERY)
            .eq('property_type', propertyType)
            .ilike('district', `%${district}%`)
            .neq('id', propertyId)
            .eq('is_active', true)

        if (listingType) {
            query1 = query1.eq('listing_type', listingType)
        }

        if (state) {
            query1 = query1.ilike('state', `%${state}%`) // Ensure strict state match too if district name is ambiguous
        }

        const { data, error } = await query1.limit(LIMIT)
        if (!error && data) {
            similarProps = [...data]
        }
    }

    // 2. Fallback: State + Property Type + Listing Type
    if (similarProps.length < LIMIT && state) {
        let query2 = supabase
            .from('listings')
            .select(LISTING_SELECT_QUERY)
            .eq('property_type', propertyType)
            .ilike('state', `%${state}%`)
            .neq('id', propertyId)
            .eq('is_active', true)

        if (listingType) {
            query2 = query2.eq('listing_type', listingType)
        }

        // Exclude already found IDs
        if (similarProps.length > 0) {
            query2 = query2.not('id', 'in', `(${similarProps.map(p => p.id).join(',')})`)
        }

        const { data, error } = await query2.limit(LIMIT - similarProps.length)
        if (!error && data) {
            similarProps = [...similarProps, ...data]
        }
    }

    // 3. Fallback: Just Listing Type + Property Type (if still desperate)
    /* 
    // Commented out to keep relevance high (User request was specific about geo-match)
    // If we wanted to show ANY 4-storey house regardless of location, we would uncomment this.
    */

    return similarProps.slice(0, LIMIT).map(transformListingToProperty)
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

// Get distinct property types from the database (cached for 5 minutes)
export async function getDistinctPropertyTypes(): Promise<string[]> {
    const cached = getCached<string[]>('distinct_property_types')
    if (cached) return cached

    const { data, error } = await supabase
        .from('listings')
        .select('property_type')
        .eq('is_active', true)
        .not('property_type', 'is', null)
        .limit(1000)

    if (error) {
        console.error('Error fetching property types:', error)
        return []
    }

    const types = data?.map(d => d.property_type).filter(Boolean) || []
    // Sort with general property types (without storey numbers) first,
    // then storey-specific types (starting with numbers like "1-Storey", "1.5-Storey")
    const uniqueTypes = [...new Set(types)].sort((a, b) => {
        const aStartsWithNumber = /^[0-9]/.test(a)
        const bStartsWithNumber = /^[0-9]/.test(b)

        // General types (without numbers) come first
        if (!aStartsWithNumber && bStartsWithNumber) return -1
        if (aStartsWithNumber && !bStartsWithNumber) return 1

        // Within same category, sort alphabetically
        return a.localeCompare(b)
    })

    setCache('distinct_property_types', uniqueTypes, 300)
    return uniqueTypes
}

// Get distinct property types by listing type (sale or rent) - cached for 5 minutes
export async function getDistinctPropertyTypesByListingType(listingType: 'sale' | 'rent'): Promise<string[]> {
    const cacheKey = `distinct_property_types_${listingType}`
    const cached = getCached<string[]>(cacheKey)
    if (cached) return cached

    const { data, error } = await supabase
        .from('listings')
        .select('property_type')
        .eq('is_active', true)
        .eq('listing_type', listingType)
        .not('property_type', 'is', null)
        .limit(1000)

    if (error) {
        console.error('Error fetching property types by listing type:', error)
        return []
    }

    const types = data?.map(d => d.property_type).filter(Boolean) || []
    // Sort with general property types (without storey numbers) first,
    // then storey-specific types (starting with numbers like "1-Storey", "1.5-Storey")
    const uniqueTypes = [...new Set(types)].sort((a, b) => {
        const aStartsWithNumber = /^[0-9]/.test(a)
        const bStartsWithNumber = /^[0-9]/.test(b)

        // General types (without numbers) come first
        if (!aStartsWithNumber && bStartsWithNumber) return -1
        if (aStartsWithNumber && !bStartsWithNumber) return 1

        // Within same category, sort alphabetically
        return a.localeCompare(b)
    })

    setCache(cacheKey, uniqueTypes, 300)
    return uniqueTypes
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
    const cached = getCached<{
        propertyTypes: string[]
        locations: string[]
        bedrooms: number[]
        priceRange: { min: number; max: number }
    }>('filter_options')

    if (cached) return cached

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

    const result = {
        // Sort with general property types (without storey numbers) first,
        // then storey-specific types (starting with numbers like "1-Storey", "1.5-Storey")
        propertyTypes: [...propertyTypeSet].sort((a, b) => {
            const aStartsWithNumber = /^[0-9]/.test(a)
            const bStartsWithNumber = /^[0-9]/.test(b)

            // General types (without numbers) come first
            if (!aStartsWithNumber && bStartsWithNumber) return -1
            if (aStartsWithNumber && !bStartsWithNumber) return 1

            // Within same category, sort alphabetically
            return a.localeCompare(b)
        }),
        locations: [...locationSet].sort(),
        bedrooms: [...bedroomSet].sort((a, b) => a - b),
        priceRange
    }

    setCache('filter_options', result, 300)
    return result
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

export async function getPropertyCount(): Promise<number> {
    const { count, error } = await supabase
        .from('listings')
        .select('*', { count: 'estimated', head: true })
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
        .select('*', { count: 'estimated', head: true })
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
        .select('*', { count: 'estimated', head: true })
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
    location?: string
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
    if (filters?.location) {
        query = query.or(`title.ilike.%${filters.location}%,address.ilike.%${filters.location}%,state.ilike.%${filters.location}%`)
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
        address?: string  // NEW: Exact address filter
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

    if (filters?.address) {
        query = query.eq('address', filters.address)
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

// Fetch single transaction by ID
export async function getTransactionById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
        .from('transactions')
        .select('*') // Select all fields to ensure we have full details
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching transaction:', error)
        return null
    }

    return data
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
