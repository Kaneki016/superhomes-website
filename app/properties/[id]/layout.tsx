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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(price)
    }

    const title = `${property.property_name} - ${formatPrice(property.price)}`
    const description = `${property.property_type} | ${property.bedrooms > 0 ? `${property.bedrooms} bed, ` : ''}${property.bathrooms} bath, ${property.size} | ${property.state || property.address}`
    const imageUrl = property.main_image_url || property.images[0] || 'https://superhomesv1.netlify.app/og-default.jpg'

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
                    alt: property.property_name,
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
