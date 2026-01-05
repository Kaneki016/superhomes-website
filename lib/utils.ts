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
