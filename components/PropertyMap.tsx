'use client'

import { useEffect, useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { Property } from '@/lib/supabase'
import PropertyMarkerPopup from './PropertyMarkerPopup'

interface PropertyMapProps {
    properties: Property[]
    onMarkerClick?: (propertyId: string) => void
    className?: string
}

export default function PropertyMap({ properties, onMarkerClick, className = '' }: PropertyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])

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
                // Default center: Kuala Lumpur, Malaysia
                const defaultCenter: [number, number] = [3.1390, 101.6869]
                const defaultZoom = 11

                mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter, defaultZoom)

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                }).addTo(mapInstanceRef.current)
            }

            // Clear existing markers
            markersRef.current.forEach(marker => marker.remove())
            markersRef.current = []

            // Filter properties with valid coordinates (exclude -999 failed markers)
            const validProperties = properties.filter(p =>
                p.latitude != null &&
                p.longitude != null &&
                !isNaN(p.latitude) &&
                !isNaN(p.longitude) &&
                p.latitude !== -99 &&
                p.longitude !== -99
            )

            if (validProperties.length === 0) {
                console.warn('No properties with valid coordinates to display on map')
                return
            }

            // Add markers for each property
            const bounds: [number, number][] = []

            validProperties.forEach((property) => {
                if (property.latitude && property.longitude) {
                    const position: [number, number] = [property.latitude, property.longitude]
                    bounds.push(position)

                    // Create custom icon with price
                    const priceLabel = new Intl.NumberFormat('en-MY', {
                        style: 'currency',
                        currency: 'MYR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(property.price).replace('MYR', 'RM')

                    const customIcon = L.divIcon({
                        className: 'custom-marker',
                        html: `
                            <div class="property-marker">
                                <div class="marker-price">${priceLabel}</div>
                                <div class="marker-arrow"></div>
                            </div>
                        `,
                        iconSize: [120, 40],
                        iconAnchor: [60, 40],
                    })

                    const marker = L.marker(position, { icon: customIcon })
                        .addTo(mapInstanceRef.current!)

                    // Create popup content using React component
                    const popupContent = renderToString(<PropertyMarkerPopup property={property} />)

                    marker.bindPopup(popupContent, {
                        maxWidth: 280,
                        className: 'property-popup'
                    })

                    // Handle marker click
                    marker.on('click', () => {
                        if (onMarkerClick) {
                            onMarkerClick(property.id)
                        }
                    })

                    markersRef.current.push(marker)
                }
            })

            // Fit map bounds to show all markers
            if (bounds.length > 0) {
                mapInstanceRef.current!.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 15
                })
            }
        })

        // Cleanup function
        return () => {
            markersRef.current.forEach(marker => marker.remove())
            markersRef.current = []
        }
    }, [properties, onMarkerClick])

    // Cleanup map on unmount
    useEffect(() => {
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    return (
        <>
            <div
                ref={mapRef}
                className={`w-full h-full rounded-lg ${className}`}
                style={{ minHeight: '500px' }}
            />

            {/* Custom styles for markers */}
            <style jsx global>{`
                .property-marker {
                    position: relative;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .property-marker:hover {
                    transform: scale(1.05);
                    z-index: 1000 !important;
                }
                
                .marker-price {
                    background: linear-gradient(135deg, #EC4899 0%, #F97316 100%);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 12px;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                    border: 2px solid white;
                }
                
                .marker-arrow {
                    width: 0;
                    height: 0;
                    border-left: 6px solid transparent;
                    border-right: 6px solid transparent;
                    border-top: 6px solid white;
                    margin: 0 auto;
                    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
                }
                
                .property-popup .leaflet-popup-content-wrapper {
                    padding: 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                }
                
                .property-popup .leaflet-popup-content {
                    margin: 0;
                    width: 100% !important;
                }
                
                .property-popup .leaflet-popup-tip {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </>
    )
}
