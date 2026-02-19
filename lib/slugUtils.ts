import { Property, Contact } from './supabase'

/**
 * Generates an SEO-friendly slug from text
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces with hyphens
 * - Removes consecutive hyphens
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')      // Replace spaces with hyphens
        .replace(/-+/g, '-')       // Remove consecutive hyphens
        .replace(/^-|-$/g, '')     // Remove leading/trailing hyphens
}

/**
 * Extracts a short ID from a UUID (last 8 characters)
 */
export function getShortId(uuid: string): string {
    return uuid.slice(-8)
}

/**
 * Generates an SEO-friendly slug for a property
 * Format: {title}-for-{sale|rent}-by-{agent-name}-{short-id}
 * Example: d-rapport-for-rent-by-jo-tan-5530e6
 */
export function generatePropertySlug(property: Property): string {
    const titleSlug = slugify(property.title || property.property_name || 'property')

    // Get listing type word
    const listingType = property.listing_type === 'rent' ? 'rent' : 'sale'

    // Get agent name if available
    let agentSlug = ''
    if (property.contacts && property.contacts.length > 0) {
        const agentName = property.contacts[0].name
        if (agentName && agentName.toLowerCase() !== 'unknown') {
            agentSlug = `-by-${slugify(agentName)}`
        }
    }

    // Get short ID (last 8 characters of UUID)
    const shortId = getShortId(property.id)

    return `${titleSlug}-for-${listingType}${agentSlug}-${shortId}`
}

/**
 * Determines the category of a property based on its type
 */
export function getPropertyCategory(propertyType: string | null): string {
    if (!propertyType) return 'property'

    const type = propertyType.toLowerCase()

    const commercialTypes = [
        'shop', 'office', 'retail', 'factory', 'warehouse',
        'commercial', 'hotel', 'land', 'industrial', 'soho'
    ]

    if (commercialTypes.some(t => type.includes(t))) {
        return 'commercial'
    }

    return 'residential'
}

/**
 * Generates the full URL path for a property listing
 * Format: /{category}/{listing_type}/{state}/{slug}
 * Example: /residential/buy/selangor/d-rapport-for-sale...
 */
export function generatePropertyUrl(property: Property): string {
    const slug = generatePropertySlug(property)
    const category = getPropertyCategory(property.property_type)

    // Map listing type to URL segment
    let action = 'buy'
    if (property.listing_type === 'rent') action = 'rent'
    if (property.listing_type === 'project') action = 'projects'

    // Slugify state or fallback
    const state = slugify(property.state || 'malaysia')

    return `/${category}/${action}/${state}/${slug}`
}

/**
 * Extracts the property ID from a slug
 * The ID is the last 8 characters before any query params
 */
export function extractIdFromSlug(slug: string): string {
    // Remove any query parameters
    const cleanSlug = slug.split('?')[0]
    // The short ID is the last 8 characters
    return cleanSlug.slice(-8)
}

/**
 * Extracts searchable title terms from a slug
 * Example: 'd-rapport-for-rent-by-...' -> 'd rapport'
 */
export function extractSearchTermsFromSlug(slug: string): string {
    // Remove query params
    const cleanSlug = slug.split('?')[0]

    // Find where the standard suffix starts (-for-sale or -for-rent)
    const suffixIndex = cleanSlug.match(/-for-(sale|rent)/)?.index

    if (suffixIndex !== undefined && suffixIndex > 0) {
        // Return the part before the suffix, replacing hyphens with spaces
        return cleanSlug.substring(0, suffixIndex).replace(/-/g, ' ')
    }

    // Fallback: if structure doesn't match, take everything except last 8 chars (ID) and 'by-agent' part if possible
    // This is a rough heuristic
    const parts = cleanSlug.split('-')
    if (parts.length > 4) {
        return parts.slice(0, 3).join(' ') // First 3 words
    }

    return ''
}

/**
 * Finds a property by matching the short ID from a slug
 * Returns a filter function for database queries
 */
export function getPropertyIdFilter(slug: string): string {
    const shortId = extractIdFromSlug(slug)
    // Return the short ID for database matching
    return shortId
}
