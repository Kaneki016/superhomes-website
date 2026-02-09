import { MetadataRoute } from 'next'
import { getAgentsForSitemap } from '@/lib/database'
import { formatSitemapDate } from '@/lib/sitemap-utils'

/**
 * Agents Sitemap
 * Dynamically generates sitemap for all agent profiles
 */
export async function GET() {
    const baseUrl = 'https://superhomes.my'

    try {
        // Fetch agents (limit to 10,000)
        const agents = await getAgentsForSitemap(10000)

        const agentUrls: MetadataRoute.Sitemap = agents.map(agent => ({
            url: `${baseUrl}/agents/${agent.id}`,
            lastModified: formatSitemapDate(agent.updated_at || agent.scraped_at),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        }))

        // Return XML response
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${agentUrls.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : new Date(entry.lastModified || Date.now()).toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400',
            },
        })
    } catch (error) {
        console.error('Error generating agents sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
