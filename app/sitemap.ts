import { MetadataRoute } from 'next'

/**
 * Sitemap Index
 * This serves as the main sitemap that points to all sub-sitemaps
 * Google recommends using a sitemap index when you have more than 50,000 URLs
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://superhomes.my'

    return [
        {
            url: `${baseUrl}/sitemap/static.xml`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/sitemap/properties-sale.xml`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/sitemap/properties-rent.xml`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/sitemap/properties-projects.xml`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/sitemap/agents.xml`,
            lastModified: new Date(),
        },
        {
            url: `${baseUrl}/sitemap/resources.xml`,
            lastModified: new Date(),
        },
    ]
}
