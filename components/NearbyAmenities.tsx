'use client'

import { useEffect, useState } from 'react'
import { getNearbyAmenities } from '@/lib/amenities'
import { groupAmenitiesByType, Amenity, AmenityType } from '@/lib/amenity-types'

interface NearbyAmenitiesProps {
    latitude: number
    longitude: number
    radiusKm?: number
}

// Icons and colors for each amenity type
const amenityConfig: Record<AmenityType, { icon: string; label: string; bgColor: string; textColor: string }> = {
    school: {
        icon: '🏫',
        label: 'Schools',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
    },
    transit: {
        icon: '🚇',
        label: 'Transit Stations',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
    },
    mall: {
        icon: '🛍️',
        label: 'Shopping Malls',
        bgColor: 'bg-purple-50',
        textColor: 'text-purple-700'
    },
    hospital: {
        icon: '🏥',
        label: 'Hospitals',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700'
    }
}

export default function NearbyAmenities({ latitude, longitude, radiusKm = 5 }: NearbyAmenitiesProps) {
    const [amenities, setAmenities] = useState<Amenity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchAmenities() {
            try {
                setLoading(true)
                setError(null)
                const data = await getNearbyAmenities(latitude, longitude, radiusKm)
                setAmenities(data)
            } catch (err) {
                console.error('Error fetching amenities:', err)
                setError('Failed to load nearby amenities')
            } finally {
                setLoading(false)
            }
        }

        if (latitude && longitude && latitude !== -99) {
            fetchAmenities()
        } else {
            setLoading(false)
        }
    }, [latitude, longitude, radiusKm])

    // Don't render if coordinates are invalid
    if (!latitude || !longitude || latitude === -99) {
        return null
    }

    // Loading skeleton
    if (loading) {
        return (
            <div className="mb-6 mt-6">
                <h2 className="font-heading font-bold text-xl mb-4">Nearby Amenities</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-3"></div>
                            <div className="space-y-2">
                                <div className="h-12 bg-gray-100 rounded-lg"></div>
                                <div className="h-12 bg-gray-100 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return null // Silently fail - amenities are not critical
    }

    const groupedAmenities = groupAmenitiesByType(amenities, 3)
    const hasAnyAmenities = Object.values(groupedAmenities).some(arr => arr.length > 0)

    // Empty state
    if (!hasAnyAmenities) {
        return (
            <div className="mb-6 mt-6">
                <h2 className="font-heading font-bold text-xl mb-4">Nearby Amenities</h2>
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">No nearby amenities found within {radiusKm}km</p>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-6 mt-6">
            <h2 className="font-heading font-bold text-xl mb-4">Nearby Amenities</h2>
            <p className="text-sm text-gray-500 mb-4">Within {radiusKm}km radius</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(groupedAmenities) as AmenityType[]).map((type) => {
                    const items = groupedAmenities[type]
                    if (items.length === 0) return null

                    const config = amenityConfig[type]

                    return (
                        <div key={type}>
                            <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                                <span className="text-lg">{config.icon}</span>
                                {config.label}
                            </h3>
                            <div className="space-y-2">
                                {items.map((amenity) => (
                                    <div
                                        key={amenity.id}
                                        className={`flex items-start justify-between p-3 rounded-lg ${config.bgColor}`}
                                    >
                                        <span className={`font-medium ${config.textColor} text-sm flex-1 mr-3`}>
                                            {amenity.name}
                                        </span>
                                        <span className="text-xs text-gray-500 whitespace-nowrap mt-0.5">
                                            {amenity.distance < 1
                                                ? `${Math.round(amenity.distance * 1000)} m`
                                                : `${amenity.distance.toFixed(1)} km`}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
