import { MetadataRoute } from 'next'
import { getPropertiesForSitemap, getAgentsForSitemap } from '@/lib/database'
import { getAllResources } from '@/lib/blog'
import { generatePropertySitemapUrl, formatSitemapDate } from '@/lib/sitemap-utils'

const BASE_URL = 'https://superhomes.my'

const MALAYSIAN_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Melaka',
    'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis',
    'Putrajaya', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const [
            staticPages,
            saleProperties,
            rentProperties,
            projectProperties,
            agents,
            resources
        ] = await Promise.all([
            getStaticSitemap(),
            getPropertySitemap('sale'),
            getPropertySitemap('rent'),
            getPropertySitemap('project'),
            getAgentSitemap(),
            getResourceSitemap()
        ])

        return [
            ...staticPages,
            ...saleProperties,
            ...rentProperties,
            ...projectProperties,
            ...agents,
            ...resources
        ]
    } catch (error) {
        console.error('Error generating sitemap:', error)
        return []
    }
}

// ----------------------------------------------------------------------------
// Sub-Sitemap Generators
// ----------------------------------------------------------------------------

async function getStaticSitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/properties`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/rent`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${BASE_URL}/new-projects`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/agents`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/compare`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
        {
            url: `${BASE_URL}/resources`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]

    // State-specific property pages
    const statePages: MetadataRoute.Sitemap = MALAYSIAN_STATES.map((state) => ({
        url: `${BASE_URL}/properties?state=${encodeURIComponent(state)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
    }))

    return [...staticPages, ...statePages]
}

async function getPropertySitemap(type: 'sale' | 'rent' | 'project'): Promise<MetadataRoute.Sitemap> {
    try {
        // Limit 10k to prevent timeouts on serverless functions
        const properties = await getPropertiesForSitemap(type, 10000)

        // Map types back to URL segments if needed. 
        // Note: generatePropertySitemapUrl handles basic slugs.

        return properties.map(property => ({
            url: `${BASE_URL}${generatePropertySitemapUrl(property)}`,
            lastModified: formatSitemapDate(property.updated_at || property.scraped_at),
            changeFrequency: 'weekly',
            priority: 0.8,
        }))
    } catch (error) {
        console.error(`Error fetching properties for ${type} sitemap:`, error)
        return []
    }
}

async function getAgentSitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const agents = await getAgentsForSitemap(5000)

        return agents.map(agent => ({
            url: `${BASE_URL}/agents/${agent.id}`,
            lastModified: formatSitemapDate(agent.updated_at || agent.scraped_at),
            changeFrequency: 'monthly',
            priority: 0.6,
        }))
    } catch (error) {
        console.error('Error fetching agents for sitemap:', error)
        return []
    }
}

async function getResourceSitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const resources = getAllResources()

        return resources.map((post) => ({
            url: `${BASE_URL}/resources/${post.slug}`,
            lastModified: new Date(post.date),
            changeFrequency: 'monthly',
            priority: 0.7,
        }))
    } catch (error) {
        console.error('Error fetching resources for sitemap:', error)
        return []
    }
}
