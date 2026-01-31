'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Property } from '@/lib/types'
import { generatePropertyUrl } from '@/lib/slugUtils'

// Reliable placeholder image for new projects
const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop'

interface ProjectCardProps {
    property: Property
}

export default function ProjectCard({ property }: ProjectCardProps) {
    const [imageError, setImageError] = useState(false)

    const formatPrice = (price: number | null | undefined) => {
        if (!price) return 'Price on Request'
        return `RM ${price.toLocaleString('en-MY')}`
    }

    // Extract bedrooms display
    const bedroomsDisplay = property.total_bedrooms
        ? `${property.total_bedrooms}`
        : property.bedrooms_num
            ? `${property.bedrooms_num}`
            : property.bedrooms
                ? String(property.bedrooms).replace(/[^0-9,\s]/g, '').trim()
                : null

    // Property name with fallback
    const propertyName = property.title || property.property_name || 'Property'

    // Shorten property type for badge
    const shortPropertyType = (type: string) => {
        const shortNames: { [key: string]: string } = {
            '2-storey Terraced House': 'Terrace',
            '3-storey Terraced House': 'Terrace',
            'Terraced House': 'Terrace',
            'Semi-Detached House': 'Semi-D',
            'Semi-D': 'Semi-D',
            'Bungalow': 'Bungalow',
            'Condominium': 'Condo',
            'Apartment': 'Apartment',
            'Service Residence': 'Serviced Apt',
            'Flat': 'Flat',
            'Townhouse': 'Townhouse',
        }
        return shortNames[type] || type.split(' ')[0]
    }

    // Get valid image URL
    const getImageUrl = () => {
        if (imageError) return PLACEHOLDER_IMAGE
        return property.main_image_url || property.images?.[0] || PLACEHOLDER_IMAGE
    }

    return (
        <Link href={generatePropertyUrl(property)}>
            <article className="group bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    {!imageError ? (
                        <Image
                            src={getImageUrl()}
                            alt={propertyName}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={() => setImageError(true)}
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                            <svg className="w-16 h-16 text-primary-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-primary-400 text-sm font-medium">New Project</span>
                        </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* New Project Badge */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded-md">
                            New Launch
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                        {propertyName}
                    </h3>

                    {/* Location */}
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {property.address}
                    </p>

                    {/* Price */}
                    <div className="mt-3">
                        <p className="text-lg font-bold text-primary-600">
                            {formatPrice(property.price)}
                            <span className="text-xs font-normal text-gray-500 ml-1">Starting From</span>
                        </p>
                    </div>

                    {/* Bedrooms */}
                    {bedroomsDisplay && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {bedroomsDisplay} Bedrooms
                        </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {property.tenure && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {property.tenure}
                            </span>
                        )}
                        {property.property_type && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                {shortPropertyType(property.property_type)}
                            </span>
                        )}
                        {property.built_year && (
                            <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-full">
                                Completion: {property.built_year}
                            </span>
                        )}
                    </div>
                </div>
            </article>
        </Link>
    )
}
