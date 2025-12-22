'use client'

import { useEffect, useRef } from 'react'

interface SinglePropertyMapProps {
    latitude: number
    longitude: number
    propertyName: string
    className?: string
}

export default function SinglePropertyMap({ latitude, longitude, propertyName, className = '' }: SinglePropertyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)

    useEffect(() => {
        // Only run on client side
        if (typeof window === 'undefined' || !mapRef.current) return

        // Dynamically import Leaflet (client-side only)
        import('leaflet').then((L) => {
            // Fix for default marker icons in Next.js
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })

            // Initialize map if not already initialized
            if (!mapInstanceRef.current && mapRef.current) {
                const position: [number, number] = [latitude, longitude]

                mapInstanceRef.current = L.map(mapRef.current).setView(position, 15) // Zoom 15 for street-level view

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapInstanceRef.current)

                // Add marker for the property
                const marker = L.marker(position).addTo(mapInstanceRef.current)
                marker.bindPopup(`<b>${propertyName}</b>`).openPopup()
            }
        })

        // Cleanup map on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [latitude, longitude, propertyName])

    return (
        <div
            ref={mapRef}
            className={`w-full rounded-lg ${className}`}
            style={{ height: '400px' }}
        />
    )
}
