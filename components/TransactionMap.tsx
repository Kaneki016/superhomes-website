'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Transaction, Property } from '@/lib/supabase'


interface TransactionMapProps {
    transactions: Transaction[]
    hoveredId?: string | null
    onHover?: (id: string | null) => void
    className?: string
    colorMode?: 'price' | 'psf'
    onColorModeChange?: (mode: 'price' | 'psf') => void
    onBoundsChange?: (bounds: { minLat: number, maxLat: number, minLng: number, maxLng: number }) => void
    onPolygonComplete?: (latlngs: { lat: number, lng: number }[] | null) => void
    polygon?: { lat: number, lng: number }[] | null
    isDrawing?: boolean
    onDrawStop?: () => void
    onSelectTransaction?: (transaction: Transaction) => void
}

export default function TransactionMap({
    transactions,
    listings = [], // Default to empty array
    hoveredId,
    onHover,
    className,
    colorMode,
    onColorModeChange,
    onBoundsChange,
    onPolygonComplete,
    polygon,
    isDrawing,
    onDrawStop,
    onSelectTransaction,
    onSelectListing // Add handler for listing selection
}: TransactionMapProps & {
    listings?: Property[] // Add listings prop
    onSelectListing?: (listing: Property) => void
}) {

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const clusterGroupRef = useRef<any>(null)
    const listingsClusterGroupRef = useRef<any>(null) // New cluster group for listings
    const drawnItemsRef = useRef<any>(null)
    const drawHandlerRef = useRef<any>(null)
    const [leaflet, setLeaflet] = useState<any>(null)

    // Refs for callbacks to avoid dependency cycles
    const onDrawStopRef = useRef(onDrawStop)
    const onPolygonCompleteRef = useRef(onPolygonComplete)
    const onSelectTransactionRef = useRef(onSelectTransaction)
    const onSelectListingRef = useRef(onSelectListing)
    const onHoverRef = useRef(onHover)

    // Update refs
    useEffect(() => {
        onDrawStopRef.current = onDrawStop
        onPolygonCompleteRef.current = onPolygonComplete
        onSelectTransactionRef.current = onSelectTransaction
        onSelectListingRef.current = onSelectListing
        onHoverRef.current = onHover
    }, [onDrawStop, onPolygonComplete, onSelectTransaction, onSelectListing, onHover])

    // Layer Visibility State
    const [showTransactions, setShowTransactions] = useState(true)
    const [showListings, setShowListings] = useState(true)

    // Handle external draw trigger
    useEffect(() => {
        if (!mapInstanceRef.current || !leaflet) return

        let onTouchStart: ((e: TouchEvent) => void) | null = null

        // Cleanup function to disable any active drawer
        const cleanup = () => {
            if (drawHandlerRef.current) {
                drawHandlerRef.current.disable()
                drawHandlerRef.current = null
            }
            if (onTouchStart && mapInstanceRef.current) {
                mapInstanceRef.current.getContainer().removeEventListener('touchstart', onTouchStart)
                onTouchStart = null
            }
        }

        if (isDrawing) {
            // Check if already enabled to avoid duplicate handlers
            if (drawHandlerRef.current && drawHandlerRef.current._enabled) return

            const map = mapInstanceRef.current

            // Robustly find the Polygon constructor
            // Check leaflet.Draw first, then fallback to window.L.Draw
            const PolygonDrawer = (leaflet.Draw && leaflet.Draw.Polygon) ||
                (window.L && (window.L as any).Draw && (window.L as any).Draw.Polygon)

            if (PolygonDrawer) {
                // If there's an existing handler (even disabled), clean it up first
                cleanup()

                const drawer = new PolygonDrawer(map, {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: { color: '#4F46E5', clickable: false } // clickable: false prevents self-clicks interference
                })
                drawer.enable()
                drawHandlerRef.current = drawer

                // Fix for iOS/Touch devices: Leaflet Draw often fails to capture 'click' on touch
                // So we manually listen for touchstart and add a vertex
                if (leaflet.Browser.touch) {
                    onTouchStart = (e: TouchEvent) => {
                        // Only handle single-finger touches for drawing
                        if (e.touches.length !== 1) return

                        const touch = e.touches[0]
                        const containerPoint = map.mouseEventToContainerPoint({
                            clientX: touch.clientX,
                            clientY: touch.clientY
                        } as any)
                        const latlng = map.containerPointToLatLng(containerPoint)

                        drawer.addVertex(latlng)
                    }

                    // Add via native DOM listener
                    map.getContainer().addEventListener('touchstart', onTouchStart, { passive: false })
                }

            } else {
                console.warn('Leaflet Draw not found')
            }
        } else {
            // If not drawing, ensure disabled
            cleanup()
        }

        return cleanup
    }, [isDrawing, leaflet])

    // Sync external polygon state with drawn items (e.g. for clearing)
    useEffect(() => {
        if (!drawnItemsRef.current) return

        // If external polygon is null but we have layers, clear them
        if (!polygon && Object.keys(drawnItemsRef.current._layers).length > 0) {
            drawnItemsRef.current.clearLayers()
        }
    }, [polygon])

    // Initialize map
    useEffect(() => {
        if (typeof window === 'undefined' || !mapRef.current) return

        import('leaflet').then((module) => {
            const L = module.default || module
            // Expose Leaflet globally for plugins that rely on window.L
            // @ts-ignore
            window.L = L

            // Import markercluster and draw after Leaflet
            Promise.all([
                import('leaflet.markercluster'),
                import('leaflet-draw')
            ]).then(() => {
                setLeaflet(L)

                // Fix for default marker icons
                delete (L.Icon.Default.prototype as any)._getIconUrl
                L.Icon.Default.mergeOptions({
                    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
                })

                if (!mapInstanceRef.current && mapRef.current) {
                    const map = L.map(mapRef.current, {
                        zoomControl: false
                    }).setView([3.1390, 101.6869], 11)

                    mapInstanceRef.current = map

                    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                        subdomains: 'abcd',
                        maxZoom: 19,
                    }).addTo(mapInstanceRef.current)

                    // FeatureGroup is to store editable layers
                    drawnItemsRef.current = new L.FeatureGroup()
                    map.addLayer(drawnItemsRef.current)

                    // Handle Create Event
                    map.on(L.Draw.Event.CREATED, (e: any) => {
                        const layer = e.layer

                        // Clear existing shapes for single-selection mode
                        drawnItemsRef.current.clearLayers()
                        drawnItemsRef.current.addLayer(layer)

                        if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
                            // Extract coordinates
                            const latlngs = layer.getLatLngs()[0]
                            const points = latlngs.map((p: any) => ({ lat: p.lat, lng: p.lng }))
                            onPolygonCompleteRef.current?.(points)
                        }

                        // Reset internal and external drawing state
                        if (drawHandlerRef.current) {
                            drawHandlerRef.current = null
                        }
                        onDrawStopRef.current?.()
                    })

                    // Handle Draw Stop (User cancelled or finished)
                    map.on(L.Draw.Event.DRAWSTOP, () => {
                        if (drawHandlerRef.current) {
                            drawHandlerRef.current = null
                        }
                        onDrawStopRef.current?.()
                    })

                    // Handle Delete Event
                    map.on(L.Draw.Event.DELETED, () => {
                        onPolygonCompleteRef.current?.(null)
                    })
                }
            })
        })

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])


    // Render Transactions Layer
    useEffect(() => {
        if (!leaflet || !mapInstanceRef.current) return

        const map = mapInstanceRef.current

        // Initialize Cluster Group for Transactions
        if (!clusterGroupRef.current && leaflet.markerClusterGroup) {
            clusterGroupRef.current = leaflet.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: (cluster: any) => {
                    return leaflet.divIcon({
                        html: `<div class="bg-primary-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs border-2 border-white shadow-md">${cluster.getChildCount()}</div>`,
                        className: 'custom-cluster-icon',
                        iconSize: leaflet.point(32, 32)
                    })
                }
            })
            // Only add if visible
            if (showTransactions) {
                map.addLayer(clusterGroupRef.current)
            }
        }

        // Toggle Layer Visibility
        if (clusterGroupRef.current) {
            if (showTransactions) {
                if (!map.hasLayer(clusterGroupRef.current)) {
                    map.addLayer(clusterGroupRef.current)
                }
            } else {
                if (map.hasLayer(clusterGroupRef.current)) {
                    map.removeLayer(clusterGroupRef.current)
                }
            }
        }

        if (!clusterGroupRef.current) return;

        // Clear existing markers
        clusterGroupRef.current.clearLayers()

        if (!showTransactions) return; // Skip population if hidden

        const validTransactions = transactions.filter(t =>
            t.latitude && t.longitude && t.latitude !== -99
        )

        const newMarkers: any[] = []

        validTransactions.forEach((t) => {
            const position: [number, number] = [t.latitude!, t.longitude!]

            // Determine Color
            let fillColor = '#ef4444' // red-500
            if (colorMode === 'price') {
                if (t.price < 500000) fillColor = '#22c55e' // green-500
                else if (t.price < 1000000) fillColor = '#eab308' // yellow-500
            } else {
                // PSF Mode
                const psf = t.price / (t.built_up_sqft || t.land_area_sqft || 1)
                if (psf < 400) fillColor = '#22c55e'
                else if (psf < 800) fillColor = '#eab308'
                else fillColor = '#ef4444'
            }

            // Canvas-based Circle Marker
            const marker = leaflet.circleMarker(position, {
                radius: 6,
                fillColor: fillColor,
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
                className: 'transaction-marker'
            })

            // Click Handler
            marker.on('click', (e: any) => {
                leaflet.DomEvent.stopPropagation(e)
                // Zoom logic removed to keep it cleaner, or keep if preferred. Let's flyTo.
                map.flyTo(position, 17, { animate: true, duration: 1.5 })
                onSelectTransactionRef.current?.(t)
            })

            // Hover Events
            marker.on('mouseover', () => {
                onHoverRef.current?.(t.id)
                marker.setStyle({ radius: 9, weight: 3 })
            })
            marker.on('mouseout', () => {
                onHoverRef.current?.(null)
                marker.setStyle({ radius: 6, weight: 2 })
            })

            newMarkers.push(marker)
        })

        if (newMarkers.length > 0) {
            clusterGroupRef.current.addLayers(newMarkers)
        }

    }, [transactions, leaflet, onHover, colorMode, showTransactions])


    // Render Listings Layer
    useEffect(() => {
        if (!leaflet || !mapInstanceRef.current) return

        const map = mapInstanceRef.current

        // Initialize Cluster Group for Listings
        if (!listingsClusterGroupRef.current && leaflet.markerClusterGroup) {
            listingsClusterGroupRef.current = leaflet.markerClusterGroup({
                chunkedLoading: true,
                maxClusterRadius: 50,
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true,
                iconCreateFunction: (cluster: any) => {
                    return leaflet.divIcon({
                        html: `<div class="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-xs border-2 border-white shadow-md">${cluster.getChildCount()}</div>`,
                        className: 'custom-listing-cluster-icon',
                        iconSize: leaflet.point(32, 32)
                    })
                }
            })
            // Only add if visible
            if (showListings) {
                map.addLayer(listingsClusterGroupRef.current)
            }
        }

        // Toggle Layer Visibility
        if (listingsClusterGroupRef.current) {
            if (showListings) {
                if (!map.hasLayer(listingsClusterGroupRef.current)) {
                    map.addLayer(listingsClusterGroupRef.current)
                }
            } else {
                if (map.hasLayer(listingsClusterGroupRef.current)) {
                    map.removeLayer(listingsClusterGroupRef.current)
                }
            }
        }

        if (!listingsClusterGroupRef.current) return;

        listingsClusterGroupRef.current.clearLayers()

        if (!showListings) return;

        const validListings = listings.filter(l => l.latitude && l.longitude)

        const newListings: any[] = []

        validListings.forEach((l) => {
            const position: [number, number] = [l.latitude!, l.longitude!]

            // Listings always Blue for distinct visual
            const fillColor = '#3b82f6' // blue-500

            // Canvas-based Circle Marker (Square or Diamond for shape difference?)
            // Leaflet CircleMarker is always circular. Can use simple Icon or DivIcon but CircleMarker is performant.
            // Let's use CircleMarker with Blue color.
            const marker = leaflet.circleMarker(position, {
                radius: 7,
                fillColor: fillColor,
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9,
                className: 'listing-marker'
            })

            marker.on('click', (e: any) => {
                leaflet.DomEvent.stopPropagation(e)
                map.flyTo(position, 17, { animate: true, duration: 1.5 })
                onSelectListingRef.current?.(l)
            })

            marker.on('mouseover', () => {
                marker.setStyle({ radius: 10, weight: 3 })
            })
            marker.on('mouseout', () => {
                marker.setStyle({ radius: 7, weight: 2 })
            })

            newListings.push(marker)
        })

        if (newListings.length > 0) {
            listingsClusterGroupRef.current.addLayers(newListings)
        }

    }, [listings, leaflet, showListings])


    // Effect for Event Listeners
    useEffect(() => {
        if (!mapInstanceRef.current) return

        const handleMove = () => {
            if (!mapInstanceRef.current) return
            const b = mapInstanceRef.current.getBounds()
            onBoundsChange?.({
                minLat: b.getSouth(),
                maxLat: b.getNorth(),
                minLng: b.getWest(),
                maxLng: b.getEast()
            })
        }

        // Debounce simple implementation
        let timeout: NodeJS.Timeout
        const debouncedMove = () => {
            clearTimeout(timeout)
            timeout = setTimeout(handleMove, 500)
        }

        mapInstanceRef.current.on('moveend', debouncedMove)
        mapInstanceRef.current.on('zoomend', debouncedMove)

        // Initial call to set bounds when map is ready, if onBoundsChange is provided
        if (onBoundsChange) {
            handleMove();
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.off('moveend', debouncedMove)
                mapInstanceRef.current.off('zoomend', debouncedMove)
            }
        }
    }, [onBoundsChange])


    return (
        <div className={`relative w-full h-full ${className}`}>
            <div ref={mapRef} className="w-full h-full rounded-lg" />

            {/* Consolidated Map Controls (Bottom Right) */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 z-[1000] text-sm min-w-[220px]">

                {/* Layers Section */}
                <div className="mb-4">
                    <span className="font-bold text-gray-900 uppercase text-xs tracking-wider block mb-2">Visible Layers</span>
                    <div className="space-y-1">
                        <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors group">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm ring-1 ring-red-100"></span>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">Transactions</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={showTransactions}
                                onChange={(e) => setShowTransactions(e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                            />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1.5 rounded transition-colors group">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm ring-1 ring-blue-100"></span>
                                <span className="text-gray-700 font-medium group-hover:text-gray-900">Listings</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={showListings}
                                onChange={(e) => setShowListings(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                            />
                        </label>
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-3"></div>

                {/* Color Mode Section */}
                <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900 uppercase text-xs tracking-wider">Legend</span>
                        <div className="flex bg-gray-100 rounded p-1">
                            <button
                                onClick={() => onColorModeChange?.('price')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${colorMode === 'price' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Price
                            </button>
                            <button
                                onClick={() => onColorModeChange?.('psf')}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${colorMode === 'psf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                PSF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Legend Items */}
                <div className="space-y-2">
                    {colorMode === 'price' ? (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-xs">&lt; RM 500k</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-xs">RM 500k - 1M</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-xs">&gt; RM 1M</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-xs">&lt; RM 400 psf</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-xs">RM 400 - 800 psf</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-xs">&gt; RM 800 psf</span>
                            </div>
                        </>
                    )}

                    <div className="border-t border-gray-100 pt-2 mt-2">
                        <div className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm ring-1 ring-white"></span>
                            <span className="text-gray-600 text-xs">Active Listing</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-marker { background: transparent !important; border: none !important; }
                .map-marker { display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .map-marker-dot { width: 10px; height: 10px; background-color: #4F46E5; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .map-marker-dot.colored-dot { width: 14px; height: 14px; border-width: 2px; }
            `}</style>
        </div>
    )
}
