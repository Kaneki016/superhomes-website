'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Transaction, Property } from '@/lib/supabase'
import { Layers, Plus, Minus, X } from 'lucide-react'


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
    const [showControls, setShowControls] = useState(false) // Mobile controls toggle

    // Handle external draw trigger
    useEffect(() => {
        if (!mapInstanceRef.current || !leaflet) return

        // Cleanup function to disable any active drawer
        const cleanup = () => {
            if (drawHandlerRef.current) {
                drawHandlerRef.current.disable()
                drawHandlerRef.current = null
            }
        }

        if (isDrawing) {
            // Check if already enabled to avoid duplicate handlers
            if (drawHandlerRef.current && drawHandlerRef.current._enabled) return

            const map = mapInstanceRef.current

            // Robustly find the Rectangle constructor
            // Check leaflet.Draw first, then fallback to window.L.Draw
            const RectangleDrawer = (leaflet.Draw && leaflet.Draw.Rectangle) ||
                (window.L && (window.L as any).Draw && (window.L as any).Draw.Rectangle)

            if (RectangleDrawer) {
                // If there's an existing handler (even disabled), clean it up first
                cleanup()

                const drawer = new RectangleDrawer(map, {
                    showArea: true,
                    shapeOptions: { color: '#4F46E5', clickable: false } // clickable: false prevents self-clicks interference
                })
                drawer.enable()
                drawHandlerRef.current = drawer
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
                        zoomControl: false,
                        tap: false // Disable tap handler for mobile compatibility
                    } as any).setView([3.1390, 101.6869], 11)

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

                            // Auto-zoom to fit the drawn bounds
                            const bounds = layer.getBounds()
                            map.fitBounds(bounds, {
                                paddingTopLeft: [50, 50],
                                paddingBottomRight: [550, 50], // Extra padding on right for drawer panel
                                maxZoom: 16,
                                animate: true,
                                duration: 1
                            })
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
        }).catch(error => {
            console.error('Failed to load Leaflet map library:', error)
        })

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])


    // Memoize markers to avoid recalculating on unrelated renders (like tooltip hover)
    const markers = useMemo(() => {
        if (!leaflet) return []

        const validTransactions = transactions.filter(t =>
            t.latitude && t.longitude && t.latitude !== -99
        )

        // Group transactions by location to prevent stacking
        const locations = new Map<string, Transaction[]>()

        validTransactions.forEach(t => {
            const key = `${t.latitude},${t.longitude}`
            if (!locations.has(key)) {
                locations.set(key, [])
            }
            locations.get(key)!.push(t)
        })

        const markerArray: any[] = []

        locations.forEach((group) => {
            // distinct location group
            // Use the most recent transaction as the representative
            const representative = group.sort((a, b) =>
                new Date(b.transaction_date || 0).getTime() - new Date(a.transaction_date || 0).getTime()
            )[0]

            const position: [number, number] = [representative.latitude!, representative.longitude!]
            const count = group.length

            // Determine Color based on representative
            let fillColor = '#ef4444' // red-500
            if (colorMode === 'price') {
                if (representative.price < 500000) fillColor = '#22c55e' // green-500
                else if (representative.price < 1000000) fillColor = '#eab308' // yellow-500
            } else {
                // PSF Mode
                const psf = representative.price / (representative.built_up_sqft || representative.land_area_sqft || 1)
                if (psf < 400) fillColor = '#22c55e'
                else if (psf < 800) fillColor = '#eab308'
                else fillColor = '#ef4444'
            }

            // Canvas-based Circle Marker
            // If it's a stack, maybe make it slightly larger or give it a border
            const marker = leaflet.circleMarker(position, {
                radius: count > 1 ? 8 : 6, // Slightly larger if multiple
                fillColor: fillColor,
                color: count > 1 ? 'white' : 'white', // Could differentiate border color
                weight: count > 1 ? 3 : 2,
                opacity: 1,
                fillOpacity: 0.9,
                className: 'transaction-marker'
            })

            // Add tooltip if multiple
            if (count > 1) {
                marker.bindTooltip(`${count} transactions`, {
                    direction: 'top',
                    offset: [0, -5],
                    opacity: 0.9
                })
            }

            // Click Handler
            marker.on('click', (e: any) => {
                leaflet.DomEvent.stopPropagation(e)
                // Zoom to the clicked marker location with offset for drawer panel
                if (mapInstanceRef.current) {
                    // Calculate offset to center in visible area (accounting for ~500px drawer)
                    const map = mapInstanceRef.current
                    const targetPoint = map.project(position, 17)
                    const targetLatLng = map.unproject(targetPoint.subtract([125, 0]), 17) // Offset left by 125px (half of 250px visible shift)

                    map.flyTo(targetLatLng, 17, {
                        animate: true,
                        duration: 1.5
                    })
                }
                // Use ref for callback to avoid stale closures if effect re-runs
                // Pass the representative transaction - the drawer will fetch history for this address/location
                onSelectTransactionRef.current?.(representative)
            })

            // Hover Events
            marker.on('mouseover', () => {
                onHoverRef.current?.(representative.id)
                marker.setStyle({ radius: count > 1 ? 11 : 9, weight: 3 })
            })
            marker.on('mouseout', () => {
                onHoverRef.current?.(null)
                marker.setStyle({ radius: count > 1 ? 8 : 6, weight: count > 1 ? 3 : 2 })
            })

            markerArray.push(marker)
        })

        return markerArray
    }, [transactions, colorMode, leaflet]) // Depends on data and visual mode only

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

        // Efficiently update layers
        // Only clear and re-add if we have new markers or visibility changed to true
        if (showTransactions) {
            clusterGroupRef.current.clearLayers()
            if (markers.length > 0) {
                clusterGroupRef.current.addLayers(markers)
            }
        }

    }, [markers, leaflet, showTransactions]) // Dependency on markers (memoized), not raw transactions/callbacks


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

            // Determine Color based on listing type
            let fillColor = '#3b82f6' // blue-500 default (Sale)
            if (l.listing_type === 'rent') {
                fillColor = '#a855f7' // purple-500 (Rent)
            }

            // Canvas-based Circle Marker
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

            {/* Mobile Controls Backdrop */}
            {showControls && (
                <div
                    className="lg:hidden fixed inset-0 z-[1000] bg-black/20 backdrop-blur-sm"
                    onClick={() => setShowControls(false)}
                ></div>
            )}

            {/* Consolidated Map Controls (Bottom Right) */}
            <div className={`absolute bottom-24 right-4 lg:bottom-6 lg:right-6 z-[1000] flex flex-col items-end gap-3 pointer-events-none`}>

                {/* Zoom Controls (Pointer Events Enable) */}
                <div className="flex flex-col gap-1 pointer-events-auto shadow-lg rounded-lg border border-gray-200 bg-white overflow-hidden">
                    <button
                        onClick={() => mapInstanceRef.current?.zoomIn()}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-colors border-b border-gray-100"
                        title="Zoom In"
                    >
                        <Plus size={20} />
                    </button>
                    <button
                        onClick={() => mapInstanceRef.current?.zoomOut()}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-700 transition-colors"
                        title="Zoom Out"
                    >
                        <Minus size={20} />
                    </button>
                </div>

                {/* Mobile Toggle Button (Pointer Events Enable) */}
                <button
                    onClick={() => setShowControls(!showControls)}
                    className="pointer-events-auto lg:hidden w-10 h-10 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center text-gray-700 active:scale-95 transition-transform"
                >
                    <Layers size={20} />
                </button>

                {/* Controls Container (Layer & Legend) */}
                {/* Mobile: Bottom Sheet | Desktop: Popover */}
                <div className={`
                    pointer-events-auto
                    transition-all duration-300 ease-out
                    
                    /* Mobile Styles (Bottom Sheet) */
                    ${showControls ? 'fixed bottom-0 left-0 right-0 translate-y-0 rounded-t-2xl' : 'fixed bottom-0 left-0 right-0 translate-y-full rounded-t-2xl'}
                    lg:static lg:translate-y-0 lg:rounded-lg
                    
                    /* Desktop Styles - Always Visible */
                    lg:opacity-100 lg:scale-100 lg:block
                    
                    bg-white/95 backdrop-blur-md lg:backdrop-blur-sm 
                    p-5 lg:p-4 
                    shadow-2xl lg:shadow-lg 
                    border-t lg:border border-gray-200 
                    text-sm 
                    w-full lg:w-auto lg:min-w-[220px]
                    z-[1100] lg:z-auto
                `}>

                    {/* Mobile Sheet Header */}
                    <div className="lg:hidden flex justify-between items-center mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">Map Layers</h3>
                        <button onClick={() => setShowControls(false)} className="p-1 rounded-full hover:bg-gray-100">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    {/* Layers Section */}
                    <div className="mb-6 lg:mb-4">
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
                    <div className="space-y-3 lg:space-y-2 pb-safe lg:pb-0"> {/* Added pb-safe for mobile home bar */}
                        {colorMode === 'price' ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-1 ring-white"></span>
                                    <span className="text-gray-600 text-sm md:text-xs">&lt; RM 500k</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm ring-1 ring-white"></span>
                                    <span className="text-gray-600 text-sm md:text-xs">RM 500k - 1M</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-1 ring-white"></span>
                                    <span className="text-gray-600 text-sm md:text-xs">&gt; RM 1M</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm ring-1 ring-white"></span>
                                    <span className="text-gray-600 text-sm md:text-xs">&lt; RM 400 psf</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm ring-1 ring-white"></span>
                                    <span className="text-gray-600 text-sm md:text-xs">RM 400 - 800 psf</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm ring-1 ring-white"></span>
                                    <span className="text-gray-600 text-sm md:text-xs">&gt; RM 800 psf</span>
                                </div>
                            </>
                        )}

                        <div className="border-t border-gray-100 pt-3 lg:pt-2 mt-2 space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-sm md:text-xs">For Sale</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm ring-1 ring-white"></span>
                                <span className="text-gray-600 text-sm md:text-xs">For Rent</span>
                            </div>
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
