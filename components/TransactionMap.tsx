'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Transaction } from '@/lib/supabase'


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
    onSelectTransaction
}: TransactionMapProps) {

    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const clusterGroupRef = useRef<any>(null)
    const drawControlRef = useRef<any>(null)
    const drawnItemsRef = useRef<any>(null)
    const drawHandlerRef = useRef<any>(null)
    const [leaflet, setLeaflet] = useState<any>(null)

    // Handle external draw trigger
    useEffect(() => {
        if (!mapInstanceRef.current || !leaflet) return

        if (!isDrawing) {
            // Cancel drawing if disabled externally
            if (drawHandlerRef.current) {
                drawHandlerRef.current.disable()
                drawHandlerRef.current = null
            }
            return
        }

        // If enabling drawing
        if (isDrawing) {
            // If already drawing, do nothing
            if (drawHandlerRef.current && drawHandlerRef.current._enabled) return

            // Start Polygon Drawer
            const map = mapInstanceRef.current

            // Use window.L.Draw.Polygon if available, or access via leaflet object if possible
            // Since we loaded leaflet-draw, L.Draw should be attached to L
            const PolygonDrawer = (leaflet.Draw && leaflet.Draw.Polygon) || (window.L && (window.L as any).Draw && (window.L as any).Draw.Polygon)

            if (PolygonDrawer) {
                const drawer = new PolygonDrawer(map, {
                    allowIntersection: false,
                    showArea: true,
                    shapeOptions: { color: '#4F46E5' }
                })
                drawer.enable()
                drawHandlerRef.current = drawer
            }
        }

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

        import('leaflet').then((L) => {
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

                    // Draw Control removed in favor of external button
                    // But we keep the event listeners below


                    // Handle Create Event
                    map.on(L.Draw.Event.CREATED, (e: any) => {
                        const layer = e.layer

                        // Clear existing shapes for single-selection mode
                        drawnItemsRef.current.clearLayers()
                        drawnItemsRef.current.addLayer(layer)

                        if (e.layerType === 'polygon' || e.layerType === 'rectangle') {
                            // Extract coordinates
                            // Polygon latlngs are nested array [[latlng, ...]]
                            const latlngs = layer.getLatLngs()[0]
                            // Normalize to simple object array
                            const points = latlngs.map((p: any) => ({ lat: p.lat, lng: p.lng }))
                            onPolygonComplete?.(points)
                        }

                        // Reset internal and external drawing state
                        if (drawHandlerRef.current) {
                            // drawHandlerRef.current.disable() // handled automatically by "created"?
                            drawHandlerRef.current = null
                        }
                        onDrawStop?.()
                    })

                    // Handle Draw Stop (User cancelled or finished)
                    map.on(L.Draw.Event.DRAWSTOP, () => {
                        if (drawHandlerRef.current) {
                            drawHandlerRef.current = null
                        }
                        onDrawStop?.()
                    })

                    // Handle Delete Event
                    map.on(L.Draw.Event.DELETED, () => {
                        onPolygonComplete?.(null)
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

    // Transport Layer Removed for Performance


    // Transaction/Station Markers Effect
    useEffect(() => {
        if (!leaflet || !mapInstanceRef.current) return

        const map = mapInstanceRef.current

        // Initialize Cluster Group if not exists
        if (!clusterGroupRef.current && leaflet.markerClusterGroup) {
            clusterGroupRef.current = leaflet.markerClusterGroup({
                chunkedLoading: true, // Optimize performance
                maxClusterRadius: 50, // Aggregate closer points
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false,
                zoomToBoundsOnClick: true
            })
            map.addLayer(clusterGroupRef.current)
        }

        // Ensure cluster group is ready
        if (!clusterGroupRef.current) return;

        // Clear existing markers from cluster group
        clusterGroupRef.current.clearLayers()
        // markersRef.current.clear() // No longer needed as markersRef is removed

        // Remove heat layer if it exists (if it was ever added by this component)
        // if (heatLayerRef.current) { // heatLayerRef is removed
        //     heatLayerRef.current.remove()
        //     heatLayerRef.current = null
        // }

        // ==========================================
        // RENDER: TRANSACTIONS MODE
        // ==========================================
        const validTransactions = transactions.filter(t =>
            t.latitude && t.longitude && t.latitude !== -99
        )

        const newMarkers: any[] = []

        validTransactions.forEach((t) => {
            const position: [number, number] = [t.latitude!, t.longitude!]
            const priceLabel = formatPrice(t.price)
            const dateStr = t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : 'N/A'

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
                className: 'transaction-marker' // For cleanup if needed, though we track via refs
            }) // DO NOT ADD TO MAP DIRECTLY

            // Determine Size Label & PSF Value for display
            const sizeLabel = t.built_up_sqft ? `${t.built_up_sqft.toLocaleString()} sqft (BU)` : (t.land_area_sqft ? `${t.land_area_sqft.toLocaleString()} sqft (LA)` : 'N/A')
            const displayPsf = t.price / (t.built_up_sqft || t.land_area_sqft || 1)

            const popupContent = `
                <div class="p-1 min-w-[240px] font-sans">
                    <!-- Header -->
                    <div class="flex items-center justify-between mb-2">
                         <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full shadow-sm" style="background-color: ${fillColor}"></span>
                            <h3 class="font-bold text-gray-900 text-lg leading-none">${formatPrice(t.price)}</h3>
                         </div>
                         <span class="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">${dateStr}</span>
                    </div>

                    <!-- Address -->
                    <p class="text-sm font-semibold text-gray-800 mb-3 leading-tight border-b pb-2">${t.address || 'Address not available'}</p>

                    <!-- Details Grid -->
                    <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600">
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Type</span>
                            <span class="font-medium text-gray-900 truncate block" title="${t.property_type}">${t.property_type || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Tenure</span>
                            <span class="font-medium text-gray-900 truncate block">${t.tenure || '-'}</span>
                        </div>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Size</span>
                            <span class="font-medium text-gray-900">${sizeLabel}</span>
                        </div>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-0.5">Price/Sqft</span>
                            <span class="font-medium text-gray-900">RM ${displayPsf.toFixed(0)} psf</span>
                        </div>
                        ${t.unit_level ? `
                        <div class="col-span-2 pt-1 mt-1 border-t border-dashed">
                             <div class="flex gap-2">
                                <span class="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Level:</span>
                                <span class="font-medium text-gray-900">${t.unit_level}</span>
                             </div>
                        </div>` : ''}
                    </div>
                </div>
            `
            // Click Handler instead of Popup
            marker.on('click', (e: any) => {
                // Prevent map click propagation if necessary
                leaflet.DomEvent.stopPropagation(e)

                // Zoom to location
                map.flyTo(position, 17, {
                    animate: true,
                    duration: 1.5
                })

                onSelectTransaction?.(t)
            })

            // Hover Events
            marker.on('mouseover', () => {
                onHover?.(t.id)
                marker.setStyle({ radius: 9, weight: 3 })
                // marker.bringToFront() // Not needed in cluster?
            })
            marker.on('mouseout', () => {
                onHover?.(null)
                marker.setStyle({ radius: 6, weight: 2 })
            })

            // markersRef.current.set(t.id, marker) // No longer needed as markersRef is removed
            newMarkers.push(marker)
        })

        // Add all markers to cluster group at once
        if (newMarkers.length > 0) {
            clusterGroupRef.current.addLayers(newMarkers)
        }

    }, [transactions, leaflet, onHover, colorMode])


    // Auto-zoom when searching




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

    const formatPrice = (price: number) => {
        if (price >= 1000000) return `RM${(price / 1000000).toFixed(2)}M`
        return `RM${(price / 1000).toFixed(0)}K`
    }

    return (
        <div className={`relative w-full h-full ${className}`}>
            <div ref={mapRef} className="w-full h-full rounded-lg" />

            {/* Map Legend Overlay */}
            <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-lg border border-gray-200 z-[1000] text-sm min-w-[200px]">
                <div className="flex items-center justify-between mb-3 gap-3">
                    <span className="font-bold text-gray-700 uppercase text-xs">Color By</span>
                    <div className="flex bg-gray-100 rounded p-1">
                        <button
                            onClick={() => onColorModeChange?.('price')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${colorMode === 'price' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Price
                        </button>
                        <button
                            onClick={() => onColorModeChange?.('psf')}
                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${colorMode === 'psf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            PSF
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {colorMode === 'price' ? (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                                <span className="text-gray-700">&lt; RM 500k</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></span>
                                <span className="text-gray-700">RM 500k - 1M</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                                <span className="text-gray-700">&gt; RM 1M</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></span>
                                <span className="text-gray-700">&lt; RM 400 psf</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></span>
                                <span className="text-gray-700">RM 400 - 800 psf</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></span>
                                <span className="text-gray-700">&gt; RM 800 psf</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .custom-marker { background: transparent !important; border: none !important; }
                .map-marker { display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .map-marker-dot { width: 10px; height: 10px; background-color: #4F46E5; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
                .map-marker-dot.colored-dot { width: 14px; height: 14px; border-width: 2px; }
                .map-marker-dot.bg-green-500 { background-color: #22c55e; }
                .map-marker-dot.bg-yellow-500 { background-color: #eab308; }
                .map-marker-dot.bg-red-500 { background-color: #ef4444; }
                .map-marker-label { display: none; margin-left: 4px; background: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #333; box-shadow: 0 1px 3px rgba(0,0,0,0.1); opacity: 0.9; }
                .map-marker.highlighted .map-marker-dot { transform: scale(1.5); }
                .map-marker.highlighted .map-marker-label { display: block; }
            `}</style>
        </div>
    )
}
