import sql from './db'
import { Property, Agent, Contact, Listing, ListingSaleDetails, ListingRentDetails, ListingProjectDetails } from './supabase'
import { extractSearchTermsFromSlug, extractIdFromSlug } from './slugUtils'

// Simple in-memory cache
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

// Transform listing data from JSON result to Property type
// Adapted to handle Postgres returned JSON structure
function transformListingToProperty(listing: any): Property {
    const property: Property = {
        id: listing.id,
        listing_url: listing.listing_url,
        listing_type: listing.listing_type,
        title: listing.title,
        scraped_at: listing.scraped_at,
        updated_at: listing.updated_at,
        created_at: listing.scraped_at,
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
        property_name: listing.title,
        size: listing.floor_area_sqft,
        bedrooms_num: listing.total_bedrooms,
        source: 'propertyguru',
        category: listing.listing_type === 'sale' ? 'buy' :
            listing.listing_type === 'rent' ? 'rent' : 'new_projects',
    }

    const saleDetails = listing.listing_sale_details?.[0]
    const rentDetails = listing.listing_rent_details?.[0]
    const projectDetails = listing.listing_project_details?.[0]

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
        if (projectDetails.main_image_url) property.main_image_url = projectDetails.main_image_url
    } else if (listing.listing_type === 'sale' && saleDetails && saleDetails.price !== undefined) {
        property.sale_details = saleDetails
        property.price = saleDetails.price
        property.price_per_sqft = saleDetails.price_per_sqft
        property.tenure = saleDetails.tenure
        property.built_year = saleDetails.year_built
        property.listed_date = saleDetails.listing_date
    } else if (listing.listing_type === 'rent' && rentDetails && rentDetails.monthly_rent !== undefined) {
        property.rent_details = rentDetails
        property.property_type = property.property_type || 'Rental'
        property.price = rentDetails.monthly_rent
        property.listed_date = rentDetails.listing_date
    } else {
        if (saleDetails?.price !== undefined) {
            property.sale_details = saleDetails
            property.price = saleDetails.price
            property.tenure = saleDetails.tenure
        } else if (rentDetails?.monthly_rent !== undefined) {
            property.rent_details = rentDetails
            property.price = rentDetails.monthly_rent
        }
    }

    // Handle contacts - flattened structure from JSON aggregation
    if (listing.listing_contacts && listing.listing_contacts.length > 0) {
        // Map structure: listing_contacts contains 'contacts' object inside
        property.contacts = listing.listing_contacts
            // Filter out null contacts or missing contact objects
            .filter((lc: any) => lc && lc.contacts)
            .map((lc: any) => lc.contacts)

        if (property.contacts && property.contacts.length > 0) {
            property.agent_id = property.contacts[0].id
        }
    }

    return property
}

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
        agent_id: contact.id,
        agency: contact.company_name,
        whatsapp_link: contact.whatsapp_url,
        created_at: contact.scraped_at,
    }
}

// Common SQL Fragments
// Using json_agg to emulate Supabase structure
const JSON_SELECT = sql`
    listings.*,
    COALESCE((SELECT json_agg(listing_sale_details.*) FROM listing_sale_details WHERE listing_id = listings.id), '[]') as listing_sale_details,
    COALESCE((SELECT json_agg(listing_rent_details.*) FROM listing_rent_details WHERE listing_id = listings.id), '[]') as listing_rent_details,
    COALESCE((SELECT json_agg(listing_project_details.*) FROM listing_project_details WHERE listing_id = listings.id), '[]') as listing_project_details,
    COALESCE(
        (
            SELECT json_agg(
                json_build_object(
                    'id', lc.id,
                    'listing_id', lc.listing_id,
                    'contact_id', lc.contact_id,
                    'linked_at', lc.linked_at,
                    'contact_role', lc.contact_role,
                    'contacts', (SELECT row_to_json(c) FROM contacts c WHERE c.id = lc.contact_id)
                )
            )
            FROM listing_contacts lc
            WHERE lc.listing_id = listings.id
        ),
        '[]'
    ) as listing_contacts
`

export async function getProperties(): Promise<Property[]> {
    try {
        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE is_active = true
            ORDER BY scraped_at DESC
        `
        return data.map(transformListingToProperty)
    } catch (error) {
        console.error('Error fetching properties:', error)
        return []
    }
}

const STOPWORDS = new Set([
    'in', 'at', 'on', 'for', 'to', 'with', 'and', 'or', 'the', 'a', 'an',
    'near', 'around', 'by', 'from', 'of', 'is', 'are', 'was', 'were'
])

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
    const offset = (page - 1) * limit

    // Base conditions
    let conditions = sql`is_active = true`

    if (filters?.listingType) {
        conditions = sql`${conditions} AND listing_type = ${filters.listingType}`
    }
    if (filters?.state) {
        conditions = sql`${conditions} AND state ILIKE ${'%' + filters.state + '%'}`
    }
    if (filters?.propertyType) {
        conditions = sql`${conditions} AND property_type ILIKE ${'%' + filters.propertyType + '%'}`
    }
    if (filters?.bedrooms) {
        conditions = sql`${conditions} AND total_bedrooms = ${filters.bedrooms}`
    }

    // Location search
    const locationQuery = filters?.location?.trim() || ''
    const words = locationQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= 2 && !STOPWORDS.has(word))

    if (words.length > 0) {
        if (words.length === 1) {
            const term = `%${words[0]}%`
            conditions = sql`${conditions} AND (
                title ILIKE ${term} OR
                address ILIKE ${term} OR
                state ILIKE ${term} OR
                property_type ILIKE ${term}
            )`
        } else {
            // Multi-word search: Client side filter preferred for complex logic, 
            // but here we can try checking if ANY word matches for broad recall, then filter more
            // Or construct a dynamic AND/OR.
            // Strategy: Match title/address with any of the words
            const firstWord = words[0]
            const term = `%${firstWord}%`
            conditions = sql`${conditions} AND (
                title ILIKE ${term} OR
                address ILIKE ${term} OR
                state ILIKE ${term} OR
                property_type ILIKE ${term}
            )`
            // We rely on post-filter for multi-word precision as per original implementation logic
        }
    }

    try {
        // Count query
        const [{ count }] = await sql`
            SELECT count(*) as count
            FROM listings
            WHERE ${conditions}
        `
        const totalCount = parseInt(count)

        // Data query
        // Note: Sort by latitude/scraped_at is complex in sql template, simplifying to scraped_at
        let orderBy = sql`ORDER BY scraped_at DESC`
        // If sorting by priority states needed, we can do it in SQL or keep client side sort.
        // Keeping it simple for SQL migration first.

        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE ${conditions}
            ${orderBy}
            LIMIT ${limit} OFFSET ${offset}
        `

        let properties = data.map(transformListingToProperty)

        // Client-side Price Filtering (because prices are in joined tables)
        // Original logic filtered client-side for multi-word or just price.
        // We can keep that logic.
        if (filters?.minPrice) {
            properties = properties.filter(p => (p.price || 0) >= filters.minPrice!)
        }
        if (filters?.maxPrice) {
            properties = properties.filter(p => (p.price || 0) <= filters.maxPrice!)
        }
        if (filters?.tenure) {
            properties = properties.filter(p => p.tenure && p.tenure.toLowerCase().includes(filters.tenure!.toLowerCase()))
        }

        // Multi-word refinement
        if (words.length > 1) {
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
            // If we filter client side, pagination breaks. 
            // Correct approach: Fetch MORE, filter, then slice. 
            // Replicating original "fetch 5000" logic if multi-word
            if (filteredResults.length < properties.length) {
                // Rerun query with higher limit
                const heavyData = await sql`
                    SELECT ${JSON_SELECT}
                    FROM listings
                    WHERE ${conditions}
                    ORDER BY scraped_at DESC
                    LIMIT 1000
                `
                let allProps = heavyData.map(transformListingToProperty)
                // Apply all filters
                if (filters?.minPrice) allProps = allProps.filter(p => (p.price || 0) >= filters.minPrice!)
                if (filters?.maxPrice) allProps = allProps.filter(p => (p.price || 0) <= filters.maxPrice!)
                if (filters?.tenure) allProps = allProps.filter(p => p.tenure && p.tenure.toLowerCase().includes(filters.tenure!.toLowerCase()))

                allProps = allProps.filter(property => {
                    const combinedText = [
                        property.title || '',
                        property.property_name || '',
                        property.address || '',
                        property.state || '',
                        property.property_type || ''
                    ].join(' ').toLowerCase()
                    return words.every(word => combinedText.includes(word))
                })

                return {
                    properties: allProps.slice(offset, offset + limit),
                    totalCount: allProps.length,
                    hasMore: (page * limit) < allProps.length
                }
            }
        }

        return {
            properties,
            totalCount,
            hasMore: (page * limit) < totalCount
        }

    } catch (error) {
        console.error('Error fetching paginated properties:', error)
        return { properties: [], totalCount: 0, hasMore: false }
    }
}

export async function getPropertiesByAgentId(
    agentId: string,
    page: number = 1,
    limit: number = 12
): Promise<{
    properties: Property[]
    totalCount: number
    hasMore: boolean
}> {
    const offset = (page - 1) * limit

    try {
        // 1. Get listing IDs for this agent
        const listingContacts = await sql`
            SELECT listing_id FROM listing_contacts WHERE contact_id = ${agentId}
        `
        const listingIds = listingContacts.map(lc => lc.listing_id)

        if (listingIds.length === 0) return { properties: [], totalCount: 0, hasMore: false }

        // 2. Get properties
        // Postgres postgres.js handles arrays in IN clause: .where('id', 'in', ids) equivalent?
        // sql`id IN ${ sql(listingIds) }`

        const [{ count }] = await sql`
            SELECT count(*) FROM listings 
            WHERE id IN ${sql(listingIds)} AND is_active = true
        `

        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE id IN ${sql(listingIds)} AND is_active = true
            ORDER BY scraped_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `

        return {
            properties: data.map(transformListingToProperty),
            totalCount: parseInt(count),
            hasMore: (page * limit) < parseInt(count)
        }
    } catch (e) {
        console.error('Error fetching agent properties:', e)
        return { properties: [], totalCount: 0, hasMore: false }
    }
}

export async function getPropertiesByAgentIds(agentIds: string[], limit: number = 12): Promise<Property[]> {
    if (!agentIds || agentIds.length === 0) return []

    try {
        const listingContacts = await sql`
            SELECT listing_id FROM listing_contacts WHERE contact_id IN ${sql(agentIds)}
        `
        const listingIds = [...new Set(listingContacts.map(lc => lc.listing_id))]
        if (listingIds.length === 0) return []

        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE id IN ${sql(listingIds)} AND is_active = true
            ORDER BY scraped_at DESC
            LIMIT ${limit}
        `
        return data.map(transformListingToProperty)
    } catch (e) {
        return []
    }
}

export async function getPropertyById(id: string): Promise<Property | null> {
    try {
        const [data] = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE id = ${id}
        `
        if (!data) return null
        return transformListingToProperty(data)
    } catch (e) {
        return null
    }
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
    const shortId = extractIdFromSlug(slug)
    const searchTerms = extractSearchTermsFromSlug(slug)

    if (searchTerms && searchTerms.length > 2) {
        const tokens = searchTerms.split(' ').filter(t => t.length > 2 && !STOPWORDS.has(t.toLowerCase()))
        if (tokens.length > 0) {
            const pattern = `%${tokens.join('%')}%`
            try {
                const matches = await sql`
                    SELECT id FROM listings 
                    WHERE title ILIKE ${pattern} 
                    LIMIT 1000
                 `
                const match = matches.find(m => m.id.toLowerCase().endsWith(shortId.toLowerCase()))
                if (match) return getPropertyById(match.id)
            } catch (e) { }
        }
    }
    return getPropertyByShortId(shortId)
}

export async function getPropertyByShortId(shortId: string): Promise<Property | null> {
    if (!shortId || shortId.length < 6) return null
    const shortIdLower = shortId.toLowerCase()

    // Scan IDs
    try {
        // Optimized: standard SQL LIKE
        const [match] = await sql`
            SELECT id FROM listings 
            WHERE id::text ILIKE ${'%' + shortIdLower}
            LIMIT 1
        `
        if (match) return getPropertyById(match.id)
    } catch (e) {
        console.error('Error in shortId search:', e)
    }
    return null
}

const MALAYSIAN_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka',
    'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis',
    'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
]

export async function getDistinctStates(): Promise<string[]> {
    const cached = getCached<string[]>('distinct_states')
    if (cached) return cached

    // Optimized: Use distinct state query
    try {
        const data = await sql`
            SELECT DISTINCT state FROM listings WHERE is_active = true AND state IS NOT NULL
        `
        const states = data.map(r => r.state).filter(s => MALAYSIAN_STATES.includes(s)).sort()
        setCache('distinct_states', states, 300)
        return states
    } catch (e) {
        return []
    }
}

export async function getFeaturedProperties(limit: number = 8): Promise<Property[]> {
    const cacheKey = `featured_properties_${limit}`
    const cached = getCached<Property[]>(cacheKey)
    if (cached && cached.length > 0) return cached

    try {
        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE is_active = true AND listing_type = 'sale'
            ORDER BY scraped_at DESC
            LIMIT ${limit * 3}
        `
        const properties = data.map(transformListingToProperty)
        // Filter for valid agent
        const result = properties.filter(p => {
            if (!p.contacts || p.contacts.length === 0) return false
            const agentName = p.contacts[0]?.name?.toLowerCase().trim()
            return agentName && agentName !== 'unknown'
        }).slice(0, limit)

        if (result.length > 0) setCache(cacheKey, result, 120)
        return result
    } catch (e) {
        return []
    }
}

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
    let conditions = sql`is_active = true AND listing_type = 'sale'`
    if (state) conditions = sql`${conditions} AND state ILIKE ${'%' + state + '%'}`
    if (filters?.propertyType) conditions = sql`${conditions} AND property_type ILIKE ${'%' + filters.propertyType + '%'}`
    if (filters?.bedrooms) conditions = sql`${conditions} AND total_bedrooms = ${filters.bedrooms}`

    try {
        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings
            WHERE ${conditions}
            ORDER BY scraped_at DESC
            LIMIT 100
        `
        let properties = data.map(transformListingToProperty)
        // Filter
        properties = properties.filter(p => {
            if (!p.price) return false
            if (!p.contacts || p.contacts.length === 0) return false
            const agentName = p.contacts[0]?.name?.toLowerCase().trim()
            if (!agentName || agentName === 'unknown') return false
            if (filters?.minPrice && p.price < parseInt(filters.minPrice)) return false
            if (filters?.maxPrice && p.price > parseInt(filters.maxPrice)) return false
            return true
        })
        properties.sort((a, b) => (b.price || 0) - (a.price || 0))
        return properties.slice(0, limit)
    } catch (e) {
        return []
    }
}

// Contacts/Agents
export async function getAgentById(id: string): Promise<Agent | null> {
    try {
        const [data] = await sql`SELECT * FROM contacts WHERE id = ${id}`
        return data ? transformContactToAgent(data) : null
    } catch (e) { return null }
}
export async function getAgentByAgentId(agentId: string): Promise<Agent | null> {
    return getAgentById(agentId)
}
export async function getAgents(): Promise<Agent[]> {
    try {
        const data = await sql`SELECT * FROM contacts WHERE contact_type = 'agent' ORDER BY name ASC`
        return data.map(transformContactToAgent)
    } catch (e) { return [] }
}

export async function searchAgents(query: string, limit: number = 5): Promise<Agent[]> {
    if (!query || query.trim().length < 2) return []
    try {
        const pattern = `%${query}%`
        const data = await sql`
            SELECT * FROM contacts 
            WHERE contact_type = 'agent' 
            AND (name ILIKE ${pattern} OR company_name ILIKE ${pattern})
            LIMIT ${limit}
        `
        return enrichAgentsWithListingCounts(data.map(transformContactToAgent))
    } catch (e) { return [] }
}

async function enrichAgentsWithListingCounts(agents: Agent[], state?: string): Promise<Agent[]> {
    if (agents.length === 0) return agents

    // Batch query possible to optimize, but keeping simple logic for now
    // Or simpler: Use a GROUP BY query on listings joined with contacts
    return Promise.all(agents.map(async agent => {
        try {
            let conditions = sql`lc.contact_id = ${agent.id} AND l.is_active = true`
            if (state) conditions = sql`${conditions} AND l.state ILIKE ${'%' + state + '%'}`

            const counts = await sql`
                SELECT l.listing_type, count(*) 
                FROM listing_contacts lc
                JOIN listings l ON l.id = lc.listing_id
                WHERE ${conditions}
                GROUP BY l.listing_type
            `
            let sale = 0, rent = 0
            counts.forEach(row => {
                if (row.listing_type === 'sale') sale = parseInt(row.count)
                if (row.listing_type === 'rent') rent = parseInt(row.count)
            })
            return { ...agent, listings_for_sale_count: sale, listings_for_rent_count: rent }
        } catch (e) { return agent }
    }))
}

const PRIORITY_STATES = ['Kuala Lumpur', 'Selangor', 'Johor', 'Penang']

export async function getAgentsPaginated(
    page: number = 1,
    limit: number = 12,
    state?: string
): Promise<{ agents: Agent[], totalCount: number, hasMore: boolean }> {
    const offset = (page - 1) * limit

    try {
        if (state) {
            // Complex state logic from original... trying to simplify
            // Original ranks agents by listing count in that state
            const stateTerm = `%${state}%`

            // Get agents with listings in this state + counts
            const [countObj] = await sql`
                 SELECT count(DISTINCT lc.contact_id)
                 FROM listing_contacts lc
                 JOIN listings l ON l.id = lc.listing_id
                 WHERE l.is_active = true AND l.state ILIKE ${stateTerm}
            `
            const totalCount = parseInt(countObj.count)

            const agentStats = await sql`
                 SELECT 
                    lc.contact_id as id,
                    SUM(CASE WHEN l.listing_type = 'sale' THEN 1 ELSE 0 END) as sale,
                    SUM(CASE WHEN l.listing_type = 'rent' THEN 1 ELSE 0 END) as rent,
                    COUNT(*) as total
                 FROM listing_contacts lc
                 JOIN listings l ON l.id = lc.listing_id
                 WHERE l.is_active = true AND l.state ILIKE ${stateTerm}
                 GROUP BY lc.contact_id
                 ORDER BY total DESC
                 LIMIT ${limit} OFFSET ${offset}
            `

            if (agentStats.length === 0) return { agents: [], totalCount: 0, hasMore: false }

            // Fetch agent details
            const ids = agentStats.map(a => a.id)
            const agents = await sql`SELECT * FROM contacts WHERE id IN ${sql(ids)}`
            const agentsMap = new Map(agents.map(a => [a.id, transformContactToAgent(a)]))

            const result = agentStats.map(stat => {
                const agent = agentsMap.get(stat.id)
                if (!agent) return null
                return { ...agent, listings_for_sale_count: parseInt(stat.sale), listings_for_rent_count: parseInt(stat.rent) }
            }).filter(Boolean) as Agent[]

            return { agents: result, totalCount, hasMore: (page * limit) < totalCount }

        } else {
            // Default pagination
            const [{ count }] = await sql`SELECT count(*) FROM contacts WHERE contact_type = 'agent'`
            const totalCount = parseInt(count)

            // We need to replicate the complex ranking logic if strict fidelity required,
            // but standard pagination is often acceptable if 'ranking' is too heavy in SQL.
            // Original: 1. Total Count. 2. Fetch all active listings to rank. 3. Sort.
            // Let's implement a simpler "Active Agents First" sort via SQL if possible using a join? 
            // Too heavy. Let's do simple pagination by name for now to avoid SQL timeout complexity without indexes.

            const data = await sql`
                 SELECT * FROM contacts 
                 WHERE contact_type = 'agent' 
                 ORDER BY name ASC 
                 LIMIT ${limit} OFFSET ${offset}
             `
            const agents = data.map(transformContactToAgent)
            const enriched = await enrichAgentsWithListingCounts(agents)
            return { agents: enriched, totalCount, hasMore: (page * limit) < totalCount }
        }
    } catch (e) {
        return { agents: [], totalCount: 0, hasMore: false }
    }
}

export async function searchProperties(filters: any): Promise<Property[]> {
    const { properties } = await getPropertiesPaginated(1, 100, filters)
    return properties
}

export async function getSimilarProperties(propertyId: string, propertyType: string, state?: string | null, listingType?: string, district?: string | null): Promise<Property[]> {
    const LIMIT = 3
    let conditions = sql`id != ${propertyId} AND is_active = true AND property_type = ${propertyType}`
    if (listingType) conditions = sql`${conditions} AND listing_type = ${listingType}`

    try {
        let results: any[] = []

        // 1. District
        if (district) {
            const dTerm = `%${district}%`
            const q1 = await sql`SELECT ${JSON_SELECT} FROM listings WHERE ${conditions} AND district ILIKE ${dTerm} LIMIT ${LIMIT}`
            results = [...q1]
        }

        // 2. State
        if (results.length < LIMIT && state) {
            const sTerm = `%${state}%`
            const excludeIds = results.map(r => r.id);
            excludeIds.push(propertyId)

            const q2 = await sql`
                SELECT ${JSON_SELECT} FROM listings 
                WHERE ${conditions} 
                AND state ILIKE ${sTerm} 
                AND id NOT IN ${sql(excludeIds)}
                LIMIT ${LIMIT - results.length}
            `
            results = [...results, ...q2]
        }

        return results.map(transformListingToProperty)
    } catch (e) { return [] }
}

export const propertyTypes = ['Condo', 'Landed', 'Commercial', 'Apartment']
export const locations = [
    'KLCC, Kuala Lumpur', 'Damansara Heights, Kuala Lumpur', 'Mont Kiara, Kuala Lumpur',
    'Bangsar, Kuala Lumpur', 'Setia Alam, Shah Alam', 'Tropicana, Petaling Jaya',
    'Cyberjaya, Selangor', 'Putrajaya', 'Subang Jaya, Selangor', 'Ampang, Kuala Lumpur',
]

// Favorites
export async function getFavoriteProperties(buyerId: string): Promise<Property[]> {
    try {
        const data = await sql`
            SELECT ${JSON_SELECT}
            FROM listings l
            JOIN favorites f ON f.property_id = l.id
            WHERE f.buyer_id = ${buyerId}
        `
        return data.map(transformListingToProperty)
    } catch (e) { return [] }
}

// Filter Options/Cache
export async function getDistinctPropertyTypes(): Promise<string[]> {
    const cached = getCached<string[]>('distinct_property_types')
    if (cached) return cached
    try {
        const data = await sql`SELECT DISTINCT property_type FROM listings WHERE is_active = true AND property_type IS NOT NULL`
        const types = data.map(r => r.property_type).sort()
        setCache('distinct_property_types', types, 300)
        return types
    } catch (e) { return [] }
}

export async function getDistinctPropertyTypesByListingType(listingType: 'sale' | 'rent'): Promise<string[]> {
    try {
        const data = await sql`
            SELECT DISTINCT property_type FROM listings 
            WHERE is_active = true AND listing_type = ${listingType} AND property_type IS NOT NULL
        `
        return data.map(r => r.property_type).sort()
    } catch (e) { return [] }
}

export async function getDistinctLocations(): Promise<string[]> {
    try {
        const data = await sql`SELECT DISTINCT address FROM listings WHERE is_active = true AND address IS NOT NULL`
        // Client side parse logic reuse
        const locationSet = new Set<string>()
        data.forEach(d => {
            if (d.address) {
                const parts = d.address.split(',').map((p: string) => p.trim())
                if (parts[0]) locationSet.add(parts[0])
                if (parts[1]) locationSet.add(parts[1])
                if (parts.length > 2 && parts[parts.length - 1]) locationSet.add(parts[parts.length - 1])
            }
        })
        return [...locationSet].sort()
    } catch (e) { return [] }
}

export async function getDistinctBedrooms(): Promise<number[]> {
    try {
        const data = await sql`SELECT DISTINCT total_bedrooms FROM listings WHERE is_active = true AND total_bedrooms > 0`
        return data.map(r => r.total_bedrooms).sort((a, b) => a - b)
    } catch (e) { return [] }
}

export async function getPriceRange(): Promise<{ min: number; max: number }> {
    try {
        const [sale] = await sql`SELECT min(price), max(price) FROM listing_sale_details`
        const [rent] = await sql`SELECT min(monthly_rent), max(monthly_rent) FROM listing_rent_details`

        const min = Math.min(sale.min || 10000000, rent.min || 10000000)
        const max = Math.max(sale.max || 0, rent.max || 0)
        return { min: min === 10000000 ? 0 : min, max }
    } catch (e) { return { min: 0, max: 10000000 } }
}

export async function getFilterOptions(): Promise<{
    propertyTypes: string[]
    locations: string[]
    bedrooms: number[]
    priceRange: { min: number; max: number }
}> {
    const [types, locs, beds, price] = await Promise.all([
        getDistinctPropertyTypes(),
        getDistinctLocations(),
        getDistinctBedrooms(),
        getPriceRange()
    ])
    return { propertyTypes: types, locations: locs, bedrooms: beds, priceRange: price }
}

export async function getPropertyCount(): Promise<number> {
    try {
        const [{ count }] = await sql`SELECT count(*) FROM listings WHERE is_active = true`
        return parseInt(count)
    } catch (e) { return 0 }
}

// Transaction / Stats Helpers (Missing implementations added)

export async function getPlatformStats() {
    try {
        const [pCount, aCount, cCount, lCount] = await Promise.all([
            sql`SELECT count(*) FROM listings`,
            sql`SELECT count(*) FROM contacts WHERE contact_type = 'agent'`,
            sql`SELECT count(DISTINCT state) FROM listings`,
            sql`SELECT count(*) FROM listings WHERE scraped_at > NOW() - INTERVAL '7 days'`
        ])

        return {
            propertyCount: parseInt(pCount[0]?.count || 0),
            agentCount: parseInt(aCount[0]?.count || 0),
            citiesCount: parseInt(cCount[0]?.count || 0),
            recentListings: parseInt(lCount[0]?.count || 0)
        }
    } catch (e) {
        return { propertyCount: 0, agentCount: 0, citiesCount: 0, recentListings: 0 }
    }
}

// Helper to build transaction conditions
function buildTransactionConditions(filters: any) {
    let conditions = sql`1 = 1`

    if (filters?.neighborhood) {
        conditions = sql`${conditions} AND neighborhood = ${filters.neighborhood}`
    }
    // New Hierarchy Filters
    if (filters?.district) {
        conditions = sql`${conditions} AND district = ${filters.district}`
    }
    if (filters?.mukim) {
        conditions = sql`${conditions} AND mukim = ${filters.mukim}`
    }

    if (filters?.minPrice) {
        conditions = sql`${conditions} AND price >= ${filters.minPrice}`
    }
    if (filters?.maxPrice) {
        conditions = sql`${conditions} AND price <= ${filters.maxPrice}`
    }
    if (filters?.propertyType && filters.propertyType.length > 0) {
        conditions = sql`${conditions} AND property_type IN ${sql(filters.propertyType)}`
    }
    if (filters?.tenure && filters.tenure.length > 0) {
        // Tenure often needs partial matching (e.g. Freehold), but if exact strings used:
        conditions = sql`${conditions} AND tenure IN ${sql(filters.tenure)}`
    }

    if (filters?.minYear) {
        conditions = sql`${conditions} AND EXTRACT(YEAR FROM transaction_date::date) >= ${filters.minYear}`
    }
    if (filters?.maxYear) {
        conditions = sql`${conditions} AND EXTRACT(YEAR FROM transaction_date::date) <= ${filters.maxYear}`
    }

    if (filters?.bounds) {
        const { minLat, maxLat, minLng, maxLng } = filters.bounds
        conditions = sql`${conditions} 
            AND latitude BETWEEN ${minLat} AND ${maxLat}
            AND longitude BETWEEN ${minLng} AND ${maxLng}`
    }

    // Exact Location Filter (for Drawer History/Trends)
    if (filters?.exactLat && filters?.exactLng) {
        // Use a small epsilon for float comparison just in case, or exact if sure.
        // Given we group by lat/lng on client, exact match should be fine if data is consistent,
        // but robust SQL suggests using a tiny range or exact equality if type is double.
        conditions = sql`${conditions} AND latitude = ${filters.exactLat} AND longitude = ${filters.exactLng}`
    }

    return conditions
}

export async function getTransactions(page: number = 1, filters: any = {}) {
    try {
        const limit = 500 // Increased limit for map density, or use clustering strategy
        // Note: For map view, we often want ALL points in bounds, not paginated.
        // But if paginated:
        const offset = (page - 1) * limit

        const conditions = buildTransactionConditions(filters)

        const data = await sql`
            SELECT 
                *,
                price::float as price,
                built_up_sqft::float as built_up_sqft,
                land_area_sqft::float as land_area_sqft,
                latitude::float as latitude,
                longitude::float as longitude
            FROM transactions 
            WHERE ${conditions}
            ORDER BY transaction_date DESC
            LIMIT ${limit} OFFSET ${offset}
        `

        // If we are filtering by bounds, we might want to return MORE data
        // For now, respect limit to prevent browser crash

        return { transactions: data, hasMore: data.length === limit }
    } catch (e) {
        console.error('Error fetching transactions:', e)
        return { transactions: [], hasMore: false }
    }
}

export async function getTransactionDistricts() {
    try {
        const data = await sql`SELECT DISTINCT district FROM transactions WHERE district IS NOT NULL`
        return data.map(r => r.district).sort()
    } catch (e) { return [] }
}

export async function getTransactionMukims(district: string) {
    try {
        const data = await sql`SELECT DISTINCT mukim FROM transactions WHERE district = ${district} AND mukim IS NOT NULL`
        return data.map(r => r.mukim).sort()
    } catch (e) { return [] }
}

export async function getNeighborhoodsByMukim(mukim: string) {
    try {
        const data = await sql`SELECT DISTINCT neighborhood FROM transactions WHERE mukim = ${mukim} AND neighborhood IS NOT NULL`
        return data.map(r => r.neighborhood).sort()
    } catch (e) { return [] }
}

export async function getTransactionMetrics(filters: any) {
    try {
        const conditions = buildTransactionConditions(filters)

        const [stats] = await sql`
            SELECT 
                count(*) as total,
                avg(price::float) as avg_price,
                min(price::float) as min_price,
                max(price::float) as max_price,
                avg(price::float / NULLIF(COALESCE(built_up_sqft::float, land_area_sqft::float), 0)) as avg_psf
            FROM transactions
            WHERE ${conditions}
        `

        return {
            avgPrice: parseFloat(stats.avg_price) || 0,
            avgPsf: parseFloat(stats.avg_psf) || 0,
            totalTransactions: parseInt(stats.total) || 0,
            minPrice: parseFloat(stats.min_price) || 0,
            maxPrice: parseFloat(stats.max_price) || 0
        }
    } catch (e) {
        console.error('Error fetching transaction metrics:', e)
        return {
            avgPrice: 0,
            avgPsf: 0,
            totalTransactions: 0,
            minPrice: 0,
            maxPrice: 0
        }
    }
}

export async function getTransactionPropertyTypes() {
    try {
        const data = await sql`SELECT DISTINCT property_type FROM transactions WHERE property_type IS NOT NULL`
        return data.map(r => r.property_type).sort()
    } catch (e) { return [] }
}

export async function getTransactionTenures() {
    try {
        const data = await sql`SELECT DISTINCT tenure FROM transactions WHERE tenure IS NOT NULL`
        return data.map(r => r.tenure).sort()
    } catch (e) { return [] }
}

export async function getTransactionById(id: string) {
    try {
        const [t] = await sql`SELECT * FROM transactions WHERE id = ${id}`
        return t || null
    } catch (e) { return null }
}
