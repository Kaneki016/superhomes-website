'use client'

import { useEffect, useState, useRef } from 'react'
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

// ── Skeleton ──────────────────────────────────────────────────────────────────
function AmenitySkeleton({ radiusKm }: { radiusKm: number }) {
    return (
        <div className="p-5">
            <h2 className="font-heading font-bold text-lg mb-0.5">Nearby Amenities</h2>
            <p className="text-xs text-gray-400 mb-5">Within {radiusKm}km radius</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                {['🏫 Schools', '🚇 Transit', '🛍️ Malls', '🏥 Hospitals'].map((label) => (
                    <div key={label} className="animate-pulse">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-4 w-4 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-9 bg-gray-100 rounded-lg" />
                            <div className="h-9 bg-gray-100 rounded-lg w-4/5" />
                            <div className="h-9 bg-gray-100 rounded-lg w-3/5" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NearbyAmenities({ latitude, longitude, radiusKm = 5 }: NearbyAmenitiesProps) {
    const [amenities, setAmenities] = useState<Amenity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    // Track whether this section is in view before initiating load
    const sectionRef = useRef<HTMLDivElement>(null)
    const [inView, setInView] = useState(false)

    // Don't render if coordinates are invalid
    const validCoords = latitude && longitude && latitude !== -99

    // ── Intersection Observer: start load only when visible ───────────────────
    // This avoids kicking off an Overpass API request for every transaction
    // that's rendered — only the one the user actually scrolls to.
    useEffect(() => {
        if (!validCoords) return
        const el = sectionRef.current
        if (!el) { setInView(true); return } // fallback: load immediately

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true)
                    obs.disconnect()
                }
            },
            { threshold: 0.1 }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [validCoords])

    // ── Fetch when in view ────────────────────────────────────────────────────
    useEffect(() => {
        if (!inView || !validCoords) {
            if (!validCoords) setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)

        getNearbyAmenities(latitude, longitude, radiusKm)
            .then((data) => { if (!cancelled) setAmenities(data) })
            .catch((err) => {
                console.error('[NearbyAmenities] fetch error:', err)
                if (!cancelled) setError('Failed to load nearby amenities')
            })
            .finally(() => { if (!cancelled) setLoading(false) })

        return () => { cancelled = true }
    }, [inView, latitude, longitude, radiusKm, validCoords])

    if (!validCoords) return null

    // Loading skeleton — shows immediately, nice perceived performance
    if (loading) {
        return (
            <div ref={sectionRef}>
                <AmenitySkeleton radiusKm={radiusKm} />
            </div>
        )
    }

    // Error state (silently fail — amenities are non-critical)
    if (error) return null

    const groupedAmenities = groupAmenitiesByType(amenities, 3)
    const hasAnyAmenities = Object.values(groupedAmenities).some(arr => arr.length > 0)

    // Empty state
    if (!hasAnyAmenities) {
        return (
            <div className="p-5">
                <h2 className="font-heading font-bold text-lg mb-0.5">Nearby Amenities</h2>
                <p className="text-xs text-gray-400 mb-4">Within {radiusKm}km radius</p>
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-sm text-gray-400">No nearby amenities found within {radiusKm}km</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-5" ref={sectionRef}>
            <h2 className="font-heading font-bold text-lg mb-0.5">Nearby Amenities</h2>
            <p className="text-xs text-gray-400 mb-5">Within {radiusKm}km radius</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                {(Object.keys(groupedAmenities) as AmenityType[]).map((type) => {
                    const items = groupedAmenities[type]
                    if (items.length === 0) return null

                    const config = amenityConfig[type]

                    return (
                        <div key={type}>
                            <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                                <span className="text-base">{config.icon}</span>
                                {config.label}
                            </h3>
                            <div className="space-y-2">
                                {items.map((amenity) => (
                                    <div
                                        key={amenity.id}
                                        className={`flex items-start justify-between px-3 py-2.5 rounded-lg ${config.bgColor} border border-transparent hover:border-gray-200 transition-colors`}
                                    >
                                        <span className={`font-semibold ${config.textColor} text-xs flex-1 mr-3 leading-snug`}>
                                            {amenity.name}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap mt-0.5 bg-white/50 px-1.5 py-0.5 rounded">
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
