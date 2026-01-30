/**
 * Shared utility functions for SuperHomes
 */

/**
 * Format a price for display in Malaysian Ringgit
 * @param price - The price to format
 * @param isRent - Whether this is a rental price (adds /month suffix)
 * @returns Formatted price string
 */
export function formatPrice(price: number | null | undefined, isRent: boolean = false): string {
    if (!price) return 'Price on Request'
    const formatted = new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        minimumFractionDigits: 0,
    }).format(price)
    return isRent ? `${formatted}/month` : formatted
}

/**
 * Format price per square foot
 * @param price - The total price
 * @param size - The size in sqft (as string or number)
 * @returns Formatted PSF string or null if not calculable
 */
export function formatPricePerSqft(price: number | null | undefined, size: string | number | null | undefined): string | null {
    if (!price || !size) return null
    const sizeNum = typeof size === 'number' ? size : parseInt(String(size).replace(/[^0-9]/g, ''))
    if (!sizeNum || sizeNum === 0) return null
    const psf = price / sizeNum
    return `RM ${psf.toFixed(2)} psf`
}

/**
 * Get a human-readable time ago string
 * @param dateString - ISO date string
 * @returns Human readable time difference
 */
export function getTimeAgo(dateString: string | undefined): string {
    if (!dateString) return ''
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return `${Math.floor(diffDays / 30)}mo ago`
}

/**
 * Format a number with commas for display
 * @param num - The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(num: number | null | undefined): string {
    if (num === null || num === undefined) return '-'
    return num.toLocaleString('en-MY')
}

/**
 * Format a price in short format for map markers and badges
 * @param price - The price to format
 * @param isRent - Whether this is a rental price (adds /mo suffix)
 * @returns Short formatted price string (e.g., "RM 1.2M", "RM 500K/mo")
 */
export function formatPriceShort(price: number | null | undefined, isRent: boolean = false): string {
    if (!price) return isRent ? 'POA' : 'Price on Request'
    const suffix = isRent ? '/mo' : ''
    if (price >= 1000000) {
        return `RM ${(price / 1000000).toFixed(1)}M${suffix}`
    }
    return `RM ${(price / 1000).toFixed(0)}K${suffix}`
}

/**
 * Format a price for full currency display (e.g., "MYR 1,500,000")
 * Used in transaction drawers and detailed views
 * @param price - The price to format
 * @returns Full formatted price string
 */
export function formatPriceFull(price: number | null | undefined): string {
    if (!price) return 'Price on Ask'
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR',
        maximumFractionDigits: 0
    }).format(price)
}

/**
 * Clean up scraped bio text by removing HTML entities, excess whitespace, and normalizing formatting
 * @param bio - The raw bio text from scraping
 * @returns Cleaned and formatted bio text
 */
export function cleanBioText(bio: string | null | undefined): string {
    if (!bio) return ''

    let cleaned = bio
        // Remove HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Remove HTML tags if any
        .replace(/<[^>]*>/g, '')
        // Remove common scraped prefixes
        .replace(/^About:\s*/i, '')
        .replace(/^Bio:\s*/i, '')
        .replace(/^Description:\s*/i, '')
        // Fix missing spaces after punctuation (e.g., "!Happy" -> "! Happy")
        .replace(/([.!?])([A-Z])/g, '$1 $2')
        // Format "Specialties & Services:" section nicely
        .replace(/Specialties\s*&\s*Services:\s*/gi, '\n\nSpecialties: ')
        .replace(/Specialties:\s*/gi, '\n\nSpecialties: ')
        // Replace multiple spaces with single space
        .replace(/  +/g, ' ')
        // Replace multiple line breaks with double line break (paragraph spacing)
        .replace(/\n\s*\n\s*\n+/g, '\n\n')
        // Trim whitespace from start and end
        .trim()

    return cleaned
}
