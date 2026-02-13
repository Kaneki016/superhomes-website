
import { getPropertiesForSitemap, getAgentsForSitemap } from '../lib/database'
import { getAllResources } from '../lib/blog'

async function debugSitemap() {
    console.log('--- Starting Sitemap Debug ---')

    // 1. Test Properties
    try {
        console.log('\nFetching Properties for Sitemap...')
        const start = Date.now()
        const properties = await getPropertiesForSitemap(undefined, 100)
        const duration = Date.now() - start
        console.log(`✅ Success: Fetched ${properties.length} properties in ${duration}ms`)
        if (properties.length > 0) {
            console.log('Sample Property:', JSON.stringify(properties[0], null, 2))
        } else {
            console.warn('⚠️ Warning: No properties found')
        }
    } catch (error) {
        console.error('❌ Error fetching properties:', error)
    }

    // 2. Test Agents
    try {
        console.log('\nFetching Agents for Sitemap...')
        const start = Date.now()
        const agents = await getAgentsForSitemap(100)
        const duration = Date.now() - start
        console.log(`✅ Success: Fetched ${agents.length} agents in ${duration}ms`)
        if (agents.length > 0) {
            console.log('Sample Agent:', JSON.stringify(agents[0], null, 2))
        } else {
            console.warn('⚠️ Warning: No agents found')
        }
    } catch (error) {
        console.error('❌ Error fetching agents:', error)
    }

    // 3. Test Resources
    try {
        console.log('\nFetching Resources for Sitemap...')
        const start = Date.now()
        const resources = getAllResources()
        const duration = Date.now() - start
        console.log(`✅ Success: Fetched ${resources.length} resources in ${duration}ms`)
        if (resources.length > 0) {
            console.log('Sample Resource:', JSON.stringify({ slug: resources[0].slug, date: resources[0].date }, null, 2))
        } else {
            console.warn('⚠️ Warning: No resources found')
        }
    } catch (error) {
        console.error('❌ Error fetching resources:', error)
    }

    console.log('\n--- Sitemap Debug Finished ---')
    process.exit(0)
}

debugSitemap().catch(e => {
    console.error('Fatal Error:', e)
    process.exit(1)
})
