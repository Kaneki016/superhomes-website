import { Metadata } from 'next'
import { getPropertyBySlug } from '@/lib/database'
import { formatPrice } from '@/lib/utils'
import { extractIdFromSlug } from '@/lib/slugUtils'

type Props = {
    params: Promise<{ category: string, action: string, state: string, slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const shortId = extractIdFromSlug(slug)
    const property = await getPropertyBySlug(slug)

    if (!property) {
        return {
            title: 'Property Not Found - SuperHomes',
        }
    }

    const propertyName = property.title || property.property_name || 'Property'
    const priceDisplay = formatPrice(property.price, property.listing_type === 'rent')

    // SEO-friendly title: {Property Name} for {Sale/Rent} in {Location} | SuperHomes
    const transactionType = property.listing_type === 'rent' ? 'Rent' : 'Sale'
    const location = property.district ? `${property.district}, ${property.state}` : (property.state || 'Malaysia')
    const title = `${propertyName} for ${transactionType} in ${location} | ${priceDisplay}`

    const bedroomCount = property.total_bedrooms || property.bedrooms_num
    const propertySize = property.floor_area_sqft || property.size || ''

    // SEO-friendly description
    const type = property.property_type || 'Property'
    const beds = bedroomCount && Number(bedroomCount) > 0 ? `${bedroomCount} Beds` : ''
    const baths = property.bathrooms ? `${property.bathrooms} Baths` : ''
    const size = propertySize ? `${propertySize}` : ''

    const specs = [beds, baths, size].filter(Boolean).join(', ')
    const description = `Find your dream ${type.toLowerCase()}! ${propertyName} is available for ${transactionType.toLowerCase()} in ${location}. ${specs}. View photos, price details and amenities on SuperHomes.`
    const imageUrl = property.main_image_url || property.images?.[0] || 'https://superhomesv1.netlify.app/og-default.jpg'

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'website',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: propertyName,
                }
            ],
            siteName: 'SuperHomes',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl],
        },
    }
}

export default function PropertyLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
