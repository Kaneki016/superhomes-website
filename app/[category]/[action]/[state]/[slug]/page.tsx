import { notFound } from 'next/navigation'
import { getPropertyBySlug, getAgentByAgentId, getSimilarProperties, getTransactions } from '@/lib/database'
import PropertyDetailClient from '@/components/PropertyDetailClient'
import { Property, Agent, Transaction } from '@/lib/types'


export async function generateMetadata({ params }: { params: Promise<{ category: string, action: string, state: string, slug: string }> }) {
    const { slug, action, state } = await params
    const propertyData = await getPropertyBySlug(slug)

    if (!propertyData) {
        return {
            title: 'Property Not Found | SuperHomes',
            description: 'The requested property could not be found.'
        }
    }

    // Format: [Property Name] - [Action] [Type] in [Area] | SuperHomes
    // Example: Amare - Buy Residential Property in Petaling Jaya | SuperHomes

    const propertyName = propertyData.title || 'Property'
    const propertyType = propertyData.property_type || 'Residential Property'
    const transactionType = action === 'buy' ? 'Buy' : action === 'rent' ? 'Rent' : 'View'
    const area = propertyData.district || propertyData.state || 'Malaysia'

    // Construct SEO title
    const title = `${propertyName} – ${transactionType} ${propertyType} in ${area} | SuperHomes`

    // SEO Description
    const price = propertyData.price ?
        (action === 'rent' ? `RM${propertyData.price}/mo` : `RM${propertyData.price.toLocaleString()}`) :
        'Price on Ask'

    const description = `${propertyName} for ${action} in ${area}. ${propertyData.bedrooms ?? '?'} Beds, ${propertyData.bathrooms ?? '?'} Baths. ${price}. View photos, details and contact agent on SuperHomes.`

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: propertyData.images && propertyData.images.length > 0
                ? [{ url: propertyData.images[0] }]
                : [],
        }
    }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ category: string, action: string, state: string, slug: string }> }) {
    const { slug } = await params

    // Fetch property data
    const propertyData = await getPropertyBySlug(slug)

    if (!propertyData) {
        notFound()
    }

    // Fetch other data in parallel
    const agentDataPromise = getAgentByAgentId(propertyData.agent_id || '')
    const similarPropertiesPromise = getSimilarProperties(
        propertyData.id,
        propertyData.property_type || '',
        propertyData.state,
        propertyData.listing_type,
        propertyData.district
    )

    // Fetch transactions if location is available
    let historicalTransactionsPromise: Promise<Transaction[]> = Promise.resolve([])
    if (propertyData.latitude && propertyData.longitude) {
        const buffer = 0.01 // Approx 1km radius
        historicalTransactionsPromise = getTransactions(1, {
            bounds: {
                minLat: propertyData.latitude - buffer,
                maxLat: propertyData.latitude + buffer,
                minLng: propertyData.longitude - buffer,
                maxLng: propertyData.longitude + buffer
            }
        }).then(result => result.transactions as Transaction[])
            .catch(e => {
                console.error('Error fetching historical trends:', e)
                return []
            })
    }

    const [agentData, similarProperties, historicalTransactions] = await Promise.all([
        agentDataPromise,
        similarPropertiesPromise,
        historicalTransactionsPromise
    ])

    return (
        <PropertyDetailClient
            property={propertyData}
            agent={agentData}
            similarProperties={similarProperties}
            historicalTransactions={historicalTransactions}
        />
    )
}
