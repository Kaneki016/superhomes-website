'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { renderToString } from 'react-dom/server'
import { Property } from '@/lib/supabase'
import PropertyMarkerPopup from './PropertyMarkerPopup'

// Export bounds interface for parent components
export interface MapBounds {
    north: number
    south: number
    east: number
    west: number
}

interface PropertyMapProps {
    properties: Property[]
    hoveredPropertyId?: string | null
    selectedPropertyId?: string | null
    onPropertyHover?: (id: string | null) => void
    onPropertySelect?: (id: string) => void
    onMarkerClick?: (propertyId: string) => void
    onBoundsChange?: (bounds: MapBounds, visiblePropertyIds: string[]) => void
    className?: string
    showControls?: boolean
}

export default function PropertyMap({
    properties,
    hoveredPropertyId,
    selectedPropertyId,
    onPropertyHover,
    onPropertySelect,
    onMarkerClick,
    onBoundsChange,
    className = '',
    showControls = true
}: PropertyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<Map<string, any>>(new Map())
    const propertiesRef = useRef<Property[]>(properties)

    // Refs for callbacks to avoid dependency cycles
    const onPropertySelectRef = useRef(onPropertySelect)
    const onMarkerClickRef = useRef(onMarkerClick)
    const onPropertyHoverRef = useRef(onPropertyHover)

    const [noValidCoordinates, setNoValidCoordinates] = useState(false)
    const [leaflet, setLeaflet] = useState<any>(null)

    // Update refs
    useEffect(() => {
        propertiesRef.current = properties
        onPropertySelectRef.current = onPropertySelect
        onMarkerClickRef.current = onMarkerClick
        onPropertyHoverRef.current = onPropertyHover
    }, [properties, onPropertySelect, onMarkerClick, onPropertyHover])

    // Function to notify parent about visible properties within bounds
    const notifyBoundsChange = useCallback(() => {
        if (!mapInstanceRef.current || !onBoundsChange) return

        const bounds = mapInstanceRef.current.getBounds()
        const mapBounds: MapBounds = {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
        }

        // Filter properties that are within the visible bounds
        const visiblePropertyIds = propertiesRef.current
            .filter(p =>
                p.latitude != null &&
                p.longitude != null &&
                p.latitude >= mapBounds.south &&
                p.latitude <= mapBounds.north &&
                p.longitude >= mapBounds.west &&
                p.longitude <= mapBounds.east
            )
            .map(p => p.id)

        onBoundsChange(mapBounds, visiblePropertyIds)
    }, [onBoundsChange])

    // Initialize map (run once)
    // Initialize map (run once)
    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current || mapInstanceRef.current) return

        let isMounted = true

        import('leaflet').then((L) => {
            if (!isMounted) return
            if (mapInstanceRef.current) return
            if (mapRef.current && (mapRef.current as any)._leaflet_id) return

            setLeaflet(L)

            // Fix for default marker icons in Next.js
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            })

            const defaultCenter: [number, number] = [3.1390, 101.6869]
            const defaultZoom = 11

            const map = L.map(mapRef.current!, {
                zoomControl: false // We'll add custom controls
            }).setView(defaultCenter, defaultZoom)

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map)

            mapInstanceRef.current = map
        })

        return () => {
            isMounted = false
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Manage event listeners separate from initialization
    useEffect(() => {
        if (!mapInstanceRef.current || !leaflet) return

        const map = mapInstanceRef.current
        map.on('moveend', notifyBoundsChange)

        return () => {
            map.off('moveend', notifyBoundsChange)
        }
    }, [leaflet, notifyBoundsChange])

    // Update markers when properties change
    useEffect(() => {
        if (!leaflet || !mapInstanceRef.current) return

        // Clear existing markers
        markersRef.current.forEach(marker => marker.remove())
        markersRef.current.clear()

        // Filter properties with valid coordinates
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

        const bounds: [number, number][] = []

        validProperties.forEach((property) => {
            if (property.latitude && property.longitude) {
                const position: [number, number] = [property.latitude, property.longitude]
                bounds.push(position)

                const priceLabel = formatPrice(property.price)
                const isHovered = hoveredPropertyId === property.id
                const isSelected = selectedPropertyId === property.id

                const customIcon = leaflet.divIcon({
                    className: 'custom-marker',
                    html: `
                        <div class="map-marker ${isHovered ? 'highlighted' : ''} ${isSelected ? 'selected' : ''}" data-id="${property.id}">
                            <div class="map-marker-price">${priceLabel}</div>
                            <div class="map-marker-arrow"></div>
                        </div>
                    `,
                    iconSize: [100, 40],
                    iconAnchor: [50, 40],
                })

                const marker = leaflet.marker(position, { icon: customIcon })
                    .addTo(mapInstanceRef.current!)

                // Create popup
                const popupContent = renderToString(<PropertyMarkerPopup property={property} />)
                marker.bindPopup(popupContent, {
                    maxWidth: 280,
                    className: 'property-popup'
                })

                // Event handlers
                marker.on('click', () => {
                    if (onPropertySelectRef.current) onPropertySelectRef.current(property.id)
                    if (onMarkerClickRef.current) onMarkerClickRef.current(property.id)
                })

                marker.on('mouseover', () => {
                    if (onPropertyHoverRef.current) onPropertyHoverRef.current(property.id)
                })

                marker.on('mouseout', () => {
                    if (onPropertyHoverRef.current) onPropertyHoverRef.current(null)
                })

                markersRef.current.set(property.id, marker)
            }
        })

        // Fit bounds
        if (bounds.length > 0 && !noValidCoordinates) {
            mapInstanceRef.current!.fitBounds(bounds, {
                padding: [50, 50],
                maxZoom: 15
            })
        }
    }, [properties, leaflet, noValidCoordinates, hoveredPropertyId, selectedPropertyId]) // Safely added dependencies

    // Update marker styles when hover changes
    useEffect(() => {
        if (!leaflet) return

        markersRef.current.forEach((marker, id) => {
            const element = marker.getElement()
            if (element) {
                const markerDiv = element.querySelector('.map-marker')
                if (markerDiv) {
                    if (id === hoveredPropertyId) {
                        markerDiv.classList.add('highlighted')
                    } else {
                        markerDiv.classList.remove('highlighted')
                    }
                    if (id === selectedPropertyId) {
                        markerDiv.classList.add('selected')
                    } else {
                        markerDiv.classList.remove('selected')
                    }
                }
            }
        })
    }, [hoveredPropertyId, selectedPropertyId, leaflet])

    const formatPrice = (price: number | null | undefined) => {
        if (!price) return 'POA'
        if (price >= 1000000) {
            return `RM${(price / 1000000).toFixed(1)}M`
        }
        return `RM${(price / 1000).toFixed(0)}K`
    }

    const handleZoomIn = useCallback(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.zoomIn()
        }
    }, [])

    const handleZoomOut = useCallback(() => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.zoomOut()
        }
    }, [])

    const handleRecenter = useCallback(() => {
        if (mapInstanceRef.current && properties.length > 0) {
            const validProperties = properties.filter(p =>
                p.latitude != null &&
                p.longitude != null &&
                p.latitude !== -99 &&
                p.longitude !== -99
            )
            if (validProperties.length > 0) {
                const bounds = validProperties.map(p => [p.latitude!, p.longitude!] as [number, number])
                mapInstanceRef.current.fitBounds(bounds, {
                    padding: [50, 50],
                    maxZoom: 15
                })
            }
        }
    }, [properties])

    return (
        <div className={`relative w-full h-full ${className}`}>
            {/* Empty State */}
            {noValidCoordinates && (
                <div className="map-empty-state">
                    <div className="map-empty-state-content">
                        <div className="map-empty-state-icon">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="map-empty-state-title">No Map Data Available</h3>
                        <p className="map-empty-state-text">
                            The properties in your current view don&apos;t have location coordinates yet.
                            Try switching to the grid view to browse these listings.
                        </p>
                    </div>
                </div>
            )}

            {/* Map Container */}
            <div
                ref={mapRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: '500px' }}
                role="application"
                aria-label="Property locations map"
            />

            {/* Map Controls */}
            {showControls && !noValidCoordinates && (
                <>
                    <div className="map-controls">
                        <button
                            onClick={handleZoomIn}
                            className="map-control-btn"
                            aria-label="Zoom in"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="map-control-btn"
                            aria-label="Zoom out"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>
                    </div>

                    <button
                        onClick={handleRecenter}
                        className="map-recenter-btn"
                        aria-label="Recenter map"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Recenter
                    </button>
                </>
            )}

            {/* Custom marker styles */}
            <style jsx global>{`
                .custom-marker {
                    background: transparent !important;
                    border: none !important;
                }

                .map-marker {
                    position: relative;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                }

                .map-marker:hover,
                .map-marker.highlighted {
                    transform: scale(1.15);
                    z-index: 1000 !important;
                }

                .map-marker-price {
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

                .map-marker.highlighted .map-marker-price {
                    box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2);
                    background: linear-gradient(135deg, #DB2777 0%, #EA580C 100%);
                }

                .map-marker-arrow {
                    width: 0;
                    height: 0;
                    border-left: 8px solid transparent;
                    border-right: 8px solid transparent;
                    border-top: 8px solid white;
                    margin: 0 auto;
                    filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1));
                }

                .property-popup .leaflet-popup-content-wrapper {
                    padding: 0;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                }

                .property-popup .leaflet-popup-content {
                    margin: 0;
                    width: 100% !important;
                }

                .property-popup .leaflet-popup-tip {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }
            `}</style>
        </div>
    )
}
