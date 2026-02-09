import { MetadataRoute } from 'next'
import { getPropertiesForSitemap } from '@/lib/database'
import { generatePropertySitemapUrl, formatSitemapDate } from '@/lib/sitemap-utils'

/**
 * New Projects Sitemap
 * Dynamically generates sitemap for all active new property projects
 */
export async function GET() {
    const baseUrl = 'https://superhomes.my'

    try {
        // Fetch new projects (limit to 50,000 as per Google's recommendation)
        const properties = await getPropertiesForSitemap('project', 50000)

        const propertyUrls: MetadataRoute.Sitemap = properties.map(property => ({
            url: `${baseUrl}${generatePropertySitemapUrl(property)}`,
            lastModified: formatSitemapDate(property.updated_at || property.scraped_at),
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }))

        // Return XML response
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${propertyUrls.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : new Date(entry.lastModified || Date.now()).toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            },
        })
    } catch (error) {
        console.error('Error generating properties-projects sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
