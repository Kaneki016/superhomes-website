import RentPageClient from './RentPageClient'
import { slugify } from '@/lib/slugUtils'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ slug?: string[] }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

function toTitleCase(str: string) {
    return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
    const p = await params
    const sp = await searchParams
    const slug = p.slug || []

    let type = ''
    let state = ''

    // Parse Slug
    if (slug.length > 0) {
        const firstPart = slug[0].toLowerCase()
        const standardStates = [
            'johor', 'kedah', 'kelantan', 'kuala-lumpur', 'labuan', 'melaka',
            'negeri-sembilan', 'pahang', 'penang', 'perak', 'perlis',
            'putrajaya', 'sabah', 'sarawak', 'selangor', 'terengganu'
        ]

        if (standardStates.includes(firstPart)) {
            state = toTitleCase(firstPart)
        } else if (firstPart === 'all-residential') {
            if (slug.length > 1) {
                state = toTitleCase(slug[1])
            }
        } else {
            // Assume type
            type = toTitleCase(firstPart)
            if (type.includes('Storey')) type = type.replace(/(\d) Storey/g, '$1-Storey')
            if (type.includes('Semi D')) type = type.replace('Semi D', 'Semi-D')

            if (slug.length > 1) {
                state = toTitleCase(slug[1])
            }
        }
    }

    // Override with Search Params
    if (sp.state && typeof sp.state === 'string') state = sp.state
    if (sp.propertyType && typeof sp.propertyType === 'string') type = sp.propertyType

    // Defaults
    const displayState = state || 'Malaysia'
    const displayType = type || 'Properties'
    const displayTypeDesc = type || 'rental properties'

    const title = `${displayType} for Rent in ${displayState}` // Layout adds | SuperHomes
    const description = `Find the best ${displayTypeDesc.toLowerCase()} in ${displayState}. Browse our wide selection of ${displayTypeDesc.toLowerCase()} for rent in ${displayState} available on SuperHomes.`

    // Construct Canonical URL
    let canonicalPath = '/rent'
    if (type) {
        canonicalPath += `/${slugify(type)}`
        if (state) {
            canonicalPath += `/${slugify(state)}`
        }
    } else if (state) {
        canonicalPath += `/all-residential/${slugify(state)}`
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
        },
        alternates: {
            canonical: canonicalPath
        }
    }
}

export default async function RentPage(props: Props) {
    return <RentPageClient />
}
