import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAgentByAgentId, getAgentStates } from '@/app/actions/property-actions'
import { slugify } from '@/lib/slugUtils'
import AgentDetailClient from './AgentDetailClient'

// Helper to extract UUID from slug
function extractIdFromSlug(slug: string): string {
    const uuidRegex = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i
    const match = slug.match(uuidRegex)
    return match ? match[1] : slug
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const { slug } = params
    const id = extractIdFromSlug(slug)

    try {
        const agent = await getAgentByAgentId(id)
        if (!agent) {
            return {
                title: 'Agent Not Found'
            }
        }

        const states = await getAgentStates(id)
        const locationString = states.length > 0 ? states.join(', ') : (agent.address || 'Malaysia')

        const description = `Find the best properties with ${agent.name} from ${agent.agency || 'SuperHomes'}. Specializing in ${locationString}. Browse ${agent.listings_for_sale_count || 0} properties for sale and ${agent.listings_for_rent_count || 0} for rent.`

        // Canonical URL construction
        const locationSlug = states.length > 0 ? states.slice(0, 2).join('-') : (agent.address || 'malaysia')
        const correctSlug = `${slugify(agent.name)}-${slugify(locationSlug)}-${agent.id}`

        return {
            title: `${agent.name} | ${locationString}`,
            description: description,
            alternates: {
                canonical: `/agents/${correctSlug}`
            }
        }
    } catch (e) {
        return {
            title: 'Agent Profile'
        }
    }
}

export default async function Page({ params }: { params: { slug: string } }) {
    const { slug } = params
    const id = extractIdFromSlug(slug)

    let agent = null
    let states: string[] = []

    try {
        agent = await getAgentByAgentId(id)
        if (agent) {
            states = await getAgentStates(id)

            // Redirect logic
            const locationSlug = states.length > 0 ? states.slice(0, 2).join('-') : (agent.address || 'malaysia')
            const correctSlug = `${slugify(agent.name)}-${slugify(locationSlug)}-${agent.id}`

            if (slug !== correctSlug) {
                redirect(`/agents/${correctSlug}`)
            }
        }
    } catch (e) {
        // If redirect throws, let it bubble up
        if (e instanceof Error && e.message === 'NEXT_REDIRECT') {
            throw e
        }
        console.error('Error fetching agent:', e)
    }

    return <AgentDetailClient initialAgent={agent} initialAgentStates={states} />
}
