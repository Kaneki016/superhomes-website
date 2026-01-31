import { notFound } from 'next/navigation'
import { getPropertyBySlug, getAgentByAgentId, getSimilarProperties, getTransactions } from '@/lib/database'
import PropertyDetailClient from '@/components/PropertyDetailClient'
import { Property, Agent, Transaction } from '@/lib/types'

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
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
