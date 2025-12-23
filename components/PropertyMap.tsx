'use client'

import { useEffect, useRef, useState } from 'react'
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
    const [noValidCoordinates, setNoValidCoordinates] = useState(false)

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

            // Filter properties with valid coordinates (exclude -99 failed markers)
            const validProperties = properties.filter(p =>
                p.latitude != null &&
                p.longitude != null &&
                !isNaN(p.latitude) &&
                !isNaN(p.longitude) &&
                p.latitude !== -99 &&
                p.longitude !== -99
            )

            if (validProperties.length === 0) {
                setNoValidCoordinates(true)
                return
            }

            setNoValidCoordinates(false)

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
            {/* Empty State Overlay */}
            {noValidCoordinates && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/90 rounded-lg">
                    <div className="text-center p-8 max-w-md">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Map Data Available</h3>
                        <p className="text-gray-600 text-sm">
                            The properties in your current view don&apos;t have location coordinates yet.
                            Try switching to the grid view to browse these listings.
                        </p>
                    </div>
                </div>
            )}

            <div
                ref={mapRef}
                className={`w-full h-full rounded-lg ${className}`}
                style={{ minHeight: '500px' }}
                role="application"
                aria-label="Property locations map"
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

