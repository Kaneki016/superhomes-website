'use client'

import Link from 'next/link'
import { Property } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

interface PropertyMarkerPopupProps {
    property: Property
}

export default function PropertyMarkerPopup({ property }: PropertyMarkerPopupProps) {

    const propertyName = property.title || property.property_name || 'Property'
    const propertySize = property.floor_area_sqft || property.size || ''
    const bedroomCount = property.total_bedrooms || property.bedrooms_num || property.bedrooms

    return (
        <Link
            href={`/properties/${property.id}`}
            className="block w-64 hover:bg-gray-50 transition-colors rounded-lg overflow-hidden"
        >
            {/* Property Image */}
            <div className="relative h-40 bg-gray-200">
                {property.main_image_url || (property.images && property.images[0]) ? (
                    <img
                        src={property.main_image_url || property.images?.[0]}
                        alt={propertyName}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                        <svg className="w-16 h-16 text-white opacity-50" width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                )}
                {/* Property Type Badge */}
                <div className="absolute top-2 left-2">
                    <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-900">
                        {property.property_type || 'Property'}
                    </span>
                </div>
                {/* Listing Type Badge */}
                {property.listing_type && (
                    <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${property.listing_type === 'sale' ? 'bg-green-500 text-white' :
                            property.listing_type === 'rent' ? 'bg-blue-500 text-white' :
                                'bg-purple-500 text-white'
                            }`}>
                            {property.listing_type === 'sale' ? 'Sale' :
                                property.listing_type === 'rent' ? 'Rent' : 'Project'}
                        </span>
                    </div>
                )}
            </div>

            {/* Property Details */}
            <div className="p-3">
                {/* Price */}
                <p className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent mb-1">
                    {formatPrice(property.price, property.listing_type === 'rent')}
                </p>

                {/* Property Name */}
                <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                    {propertyName}
                </h3>

                {/* Location */}
                <p className="text-xs text-gray-600 mb-2 line-clamp-1 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {property.address || property.state || '-'}
                </p>

                {/* Property Stats */}
                <div className="flex items-center gap-3 text-xs text-gray-600">
                    {bedroomCount && Number(bedroomCount) > 0 && (
                        <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {bedroomCount}
                        </div>
                    )}
                    {property.bathrooms && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {property.bathrooms}
                        </span>
                    )}
                    {propertySize && (
                        <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            {propertySize}
                        </span>
                    )}
                </div>

                {/* View Details Link */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-xs text-primary-600 font-medium">
                        View Details →
                    </span>
                </div>
            </div>
        </Link>
    )
}
