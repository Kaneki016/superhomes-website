import { generatePropertySlug } from './slugUtils'

/**
 * Generates a sitemap URL for a property
 */
export function generatePropertySitemapUrl(property: {
    id: string
    title: string
    listing_type?: string
    contacts?: any[]
}): string {
    const slug = generatePropertySlug(property as any)
    return `/properties/${slug}`
}

/**
 * Determines the appropriate change frequency for sitemap entries
 */
export function getChangeFrequency(
    type: 'property' | 'agent' | 'resource' | 'static',
    subtype?: string
): 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never' {
    switch (type) {
        case 'property':
            // Properties change frequently as they get sold/rented
            return 'weekly'
        case 'agent':
            // Agent profiles change less frequently
            return 'monthly'
        case 'resource':
            // Blog/resource articles rarely change after publication
            return 'monthly'
        case 'static':
            // Static pages vary by subtype
            if (subtype === 'home') return 'daily'
            if (subtype === 'properties' || subtype === 'rent') return 'hourly'
            if (subtype === 'new-projects' || subtype === 'agents') return 'daily'
            return 'weekly'
        default:
            return 'weekly'
    }
}

/**
 * Determines the appropriate priority for sitemap entries
 */
export function getPriority(
    type: 'property' | 'agent' | 'resource' | 'static',
    subtype?: string
): number {
    switch (type) {
        case 'property':
            // Individual property pages are important
            return 0.8
        case 'agent':
            // Agent profiles are moderately important
            return 0.6
        case 'resource':
            // Blog/resource articles are valuable for SEO
            return 0.7
        case 'static':
            // Static pages vary by importance
            if (subtype === 'home') return 1.0
            if (subtype === 'properties' || subtype === 'rent') return 0.9
            if (subtype === 'new-projects' || subtype === 'agents') return 0.8
            if (subtype === 'resources') return 0.8
            if (subtype === 'compare') return 0.6
            if (subtype === 'about') return 0.5
            return 0.5
        default:
            return 0.5
    }
}

/**
 * Formats a date for sitemap lastModified field
 */
export function formatSitemapDate(date: Date | string | null | undefined): Date {
    if (!date) return new Date()
    if (date instanceof Date) return date
    return new Date(date)
}
