'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Property } from '@/lib/types'
import { generatePropertyUrl } from '@/lib/slugUtils'
import { formatPriceShort } from '@/lib/utils'

interface MapPropertyCardProps {
    property: Property
    isHovered?: boolean
    isSelected?: boolean
    onHover?: (id: string | null) => void
    onClick?: (id: string) => void
}

export default function MapPropertyCard({
    property,
    isHovered = false,
    isSelected = false,
    onHover,
    onClick
}: MapPropertyCardProps) {

    const propertyName = property.title || property.property_name || 'Property'
    const propertySize = property.floor_area_sqft || property.size
    const bedroomCount = property.total_bedrooms || property.bedrooms_num || property.bedrooms

    const getPropertyImage = () => {
        if (property.images && property.images.length > 0) {
            return property.images[0]
        }
        if (property.main_image_url) {
            return property.main_image_url
        }
        return '/placeholder-property.jpg'
    }

    // Get short property type (first word only for badges)
    const getShortType = () => {
        if (!property.property_type) return null
        const type = property.property_type.toLowerCase()
        if (type.includes('apartment')) return 'Apartment'
        if (type.includes('condo')) return 'Condo'
        if (type.includes('terrace')) return 'Terrace'
        if (type.includes('semi-d') || type.includes('semi d')) return 'Semi-D'
        if (type.includes('bungalow')) return 'Bungalow'
        if (type.includes('townhouse')) return 'Townhouse'
        if (type.includes('flat')) return 'Flat'
        // Return first word for unknown types
        return property.property_type.split(' ')[0]
    }

    // Extract city from address (usually format: "Area, City, State")
    const getLocation = () => {
        const parts = property.address?.split(',').map(p => p.trim()) || []
        if (parts.length >= 2) {
            const city = parts[parts.length - 2]
            if (property.state && city !== property.state) {
                return `${city}, ${property.state}`
            }
            return city
        }
        return property.state || property.address || ''
    }

    // Parse size string - just get the number
    const getSizeValue = () => {
        if (!propertySize) return null
        const match = propertySize.match?.(/[\d,]+/)
        return match ? match[0] : propertySize
    }

    return (
        <div
            className={`map-property-card ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
            onMouseEnter={() => onHover?.(property.id)}
            onMouseLeave={() => onHover?.(null)}
            onClick={() => onClick?.(property.id)}
            data-property-id={property.id}
        >
            <Link href={generatePropertyUrl(property)} className="flex gap-3 w-full p-2">
                {/* Image Thumbnail */}
                <div className="map-card-image relative">
                    <Image
                        src={getPropertyImage()}
                        alt={propertyName}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized
                    />
                    {getShortType() && (
                        <span className="map-card-badge">
                            {getShortType()}
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    {/* Price */}
                    <div className="text-lg font-bold text-gray-900">
                        {formatPriceShort(property.price, property.listing_type === 'rent')}
                    </div>

                    {/* Title/Address - truncated */}
                    <h3 className="text-sm font-medium text-gray-800 truncate">
                        {propertyName}
                    </h3>

                    {/* Location */}
                    <p className="text-xs text-gray-500 truncate mb-1">
                        {getLocation()}
                    </p>

                    {/* Details Row */}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                        {bedroomCount && (
                            <span className="flex items-center gap-1">
                                <span className="font-medium">
                                    {String(bedroomCount).replace(/[^\d]/g, '') || bedroomCount}
                                </span> Beds
                            </span>
                        )}
                        {property.bathrooms && (
                            <span className="flex items-center gap-1">
                                <span className="font-medium">
                                    {String(property.bathrooms).replace(/[^\d]/g, '') || property.bathrooms}
                                </span> Baths
                            </span>
                        )}
                        {getSizeValue() && (
                            <span className="flex items-center gap-1">
                                <span className="font-medium">{getSizeValue()}</span> sqft
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </div>
    )
}
