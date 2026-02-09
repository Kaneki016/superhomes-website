import { MetadataRoute } from 'next'
import { getAllResources } from '@/lib/blog'

/**
 * Resources/Blog Sitemap
 * Generates sitemap for all blog articles and resources
 */
export async function GET() {
    const baseUrl = 'https://superhomes.my'

    try {
        const resources = getAllResources()

        const resourceUrls: MetadataRoute.Sitemap = resources.map((post) => ({
            url: `${baseUrl}/resources/${post.slug}`,
            lastModified: new Date(post.date),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        }))

        // Return XML response
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${resourceUrls.map(entry => `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : new Date(entry.lastModified || Date.now()).toISOString()}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`

        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
            },
        })
    } catch (error) {
        console.error('Error generating resources sitemap:', error)
        return new Response('Error generating sitemap', { status: 500 })
    }
}
