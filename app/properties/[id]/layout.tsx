import { Metadata } from 'next'
import { getPropertyById } from '@/lib/database'

type Props = {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params
    const property = await getPropertyById(id)

    if (!property) {
        return {
            title: 'Property Not Found - SuperHomes',
        }
    }

    const formatPrice = (price: number | null | undefined, isRent: boolean = false) => {
        if (!price) return 'Price on Request'
        const formatted = new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(price)
        return isRent ? `${formatted}/month` : formatted
    }

    const propertyName = property.title || property.property_name || 'Property'
    const priceDisplay = formatPrice(property.price, property.listing_type === 'rent')
    const title = `${propertyName} - ${priceDisplay}`

    const bedroomCount = property.total_bedrooms || property.bedrooms_num
    const propertySize = property.floor_area_sqft || property.size || ''
    const description = `${property.property_type || 'Property'} | ${bedroomCount && Number(bedroomCount) > 0 ? `${bedroomCount} bed, ` : ''}${property.bathrooms || ''} bath, ${propertySize} | ${property.state || property.address || ''}`
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
