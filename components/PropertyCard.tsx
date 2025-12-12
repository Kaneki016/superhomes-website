'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Property } from '@/lib/supabase'
import { getAgentById } from '@/lib/mockData'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useAuth } from '@/contexts/AuthContext'

interface PropertyCardProps {
    property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
    const agent = getAgentById(property.agent_id)
    const { user } = useAuth()
    const { isFavorite, toggleFavorite } = useFavorites()
    const router = useRouter()
    const [isToggling, setIsToggling] = useState(false)

    const favorited = isFavorite(property.id)

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(price)
    }

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault() // Prevent navigation to property page
        e.stopPropagation()

        if (!user) {
            // Redirect to login if not authenticated
            router.push('/login')
            return
        }

        if (isToggling) return

        setIsToggling(true)
        await toggleFavorite(property.id)
        setIsToggling(false)
    }

    return (
        <Link href={`/properties/${property.id}`}>
            <div className="property-card group">
                {/* Image */}
                <div className="relative h-64 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden">
                    {/* Placeholder for property image */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-20 h-20 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>

                    {/* Property Type Badge */}
                    <div className="absolute top-4 left-4">
                        <span className="glass px-3 py-1 rounded-full text-sm font-semibold text-primary-600">
                            {property.property_type}
                        </span>
                    </div>

                    {/* Favorite Heart Button */}
                    <button
                        onClick={handleFavoriteClick}
                        disabled={isToggling}
                        className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${favorited
                                ? 'bg-red-500 text-white shadow-lg scale-110'
                                : 'glass text-gray-600 hover:bg-red-50 hover:text-red-500'
                            } ${isToggling ? 'opacity-50 cursor-wait' : 'hover:scale-110'}`}
                        aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                        <svg
                            className="w-5 h-5"
                            fill={favorited ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>

                    {/* SuperHomes Watermark */}
                    <div className="absolute bottom-4 right-4 opacity-50">
                        <span className="text-white text-xs font-semibold bg-black/30 px-2 py-1 rounded">
                            SuperHomes
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-5">
                    {/* Price */}
                    <div className="mb-3">
                        <p className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                            {formatPrice(property.price)}
                        </p>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-semibold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {property.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center text-gray-600 mb-4">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm">{property.location}</span>
                    </div>

                    {/* Property Details */}
                    <div className="flex items-center space-x-4 text-gray-600 mb-4 pb-4 border-b border-gray-200">
                        {property.bedrooms > 0 && (
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span className="text-sm font-medium">{property.bedrooms} Bed</span>
                            </div>
                        )}
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                            </svg>
                            <span className="text-sm font-medium">{property.bathrooms} Bath</span>
                        </div>
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span className="text-sm font-medium">{property.built_up_size} sqft</span>
                        </div>
                    </div>

                    {/* Agent Info */}
                    {agent && (
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold mr-3">
                                {agent.name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                                <p className="text-xs text-gray-500">Property Agent</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    )
}
