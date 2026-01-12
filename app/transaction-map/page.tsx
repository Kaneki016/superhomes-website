'use client'

import { useState, useEffect } from 'react'
import { getTransactions, getDistinctNeighborhoods, getTransactionMetrics, getTransactionPropertyTypes, getTransactionTenures, getTransactionById, searchProperties } from '@/lib/database'
import { Transaction, Property } from '@/lib/supabase'
import TransactionMap from '@/components/TransactionMap'
import RangeSlider from '@/components/RangeSlider'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import TransactionDrawer from '@/components/TransactionDrawer'
import ListingDrawer from '@/components/ListingDrawer'
import { Filter, Search, X, ChevronDown, Check, Map as MapIcon, Layers, Info, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'


export default function TransactionMapPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [listings, setListings] = useState<Property[]>([]) // Listings State
    // Data State
    const [neighborhoods, setNeighborhoods] = useState<string[]>([])
    const [propertyTypes, setPropertyTypes] = useState<string[]>([])
    const [tenures, setTenures] = useState<string[]>([])

    // Visualization State
    const [colorMode, setColorMode] = useState<'price' | 'psf'>('price')
    const [currentBounds, setCurrentBounds] = useState<{ minLat: number, maxLat: number, minLng: number, maxLng: number } | undefined>(undefined)
    const [polygonFilter, setPolygonFilter] = useState<{ lat: number, lng: number }[] | null>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
    const [selectedListing, setSelectedListing] = useState<Property | null>(null) // Selected Listing State

    // Filters State
    const [openFilter, setOpenFilter] = useState<string | null>(null) // 'price' | 'type' | 'tenure' | 'recency' | null
    const [showMobileFilters, setShowMobileFilters] = useState(false) // Mobile Filter Drawer State

    // Core Filter Logic
    const [filters, setFilters] = useState({
        neighborhood: '',
        minPrice: 0,
        maxPrice: 5000000,
        propertyType: [] as string[],
        tenure: [] as string[],
        minYear: undefined as number | undefined,
        maxYear: undefined as number | undefined,
        recencyLabel: 'Date'
    })

    const [loading, setLoading] = useState(true)
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const [metrics, setMetrics] = useState({
        avgPrice: 0,
        avgPsf: 0,
        totalTransactions: 0,
        minPrice: 0,
        maxPrice: 0
    })

    // Helper: Point in Polygon (Ray Raycasting algorithm)
    const isPointInPolygon = (point: { lat: number, lng: number }, vs: { lat: number, lng: number }[]) => {
        // ray-casting algorithm based on
        // https://github.com/substack/point-in-polygon
        const x = point.lat, y = point.lng
        let inside = false
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            const xi = vs[i].lat, yi = vs[i].lng
            const xj = vs[j].lat, yj = vs[j].lng

            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
            if (intersect) inside = !inside
        }
        return inside
    }

    // Derived state for filtered transactions (Client-side Polygon Filter)
    const displayTransactions = polygonFilter
        ? transactions.filter(t => t.latitude && t.longitude && isPointInPolygon({ lat: t.latitude, lng: t.longitude }, polygonFilter))
        : transactions

    // Derived state for filtered listings (Client-side Polygon Filter)
    const displayListings = polygonFilter
        ? listings.filter(l => l.latitude && l.longitude && isPointInPolygon({ lat: l.latitude, lng: l.longitude }, polygonFilter))
        : listings

    // Update metrics based on displayTransactions locally if polygon is active
    // Otherwise use server metrics
    const displayMetrics = polygonFilter ? {
        avgPrice: displayTransactions.reduce((acc, t) => acc + t.price, 0) / (displayTransactions.length || 1),
        avgPsf: displayTransactions.reduce((acc, t) => acc + (t.price / (t.built_up_sqft || t.land_area_sqft || 1)), 0) / (displayTransactions.length || 1),
        totalTransactions: displayTransactions.length,
        minPrice: Math.min(...displayTransactions.map(t => t.price)) || 0,
        maxPrice: Math.max(...displayTransactions.map(t => t.price)) || 0
    } : metrics


    // Handle Deep Linking (Share URL)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const transactionId = params.get('transaction_id')

        if (transactionId) {
            console.log('🔗 Deep link detected for transaction:', transactionId)
            getTransactionById(transactionId).then(fetchedTx => {
                if (fetchedTx) {
                    setSelectedTransaction(fetchedTx)
                    // Ensure the transaction is visible on map (add to list if not present)
                    setTransactions(prev => {
                        const exists = prev.some(t => t.id === fetchedTx.id)
                        if (!exists) {
                            return [...prev, fetchedTx]
                        }
                        return prev
                    })
                }
            })
        }
    }, [])

    // Fetch initial options
    useEffect(() => {
        const fetchOptions = async () => {
            console.log('🔄 Fetching filter options...')
            try {
                const [n, p, t] = await Promise.all([
                    getDistinctNeighborhoods(),
                    getTransactionPropertyTypes(),
                    getTransactionTenures()
                ])
                setNeighborhoods(n)
                setPropertyTypes(p)
                setTenures(t)
            } catch (err) {
                console.error('❌ Error fetching filter options:', err)
            }
        }
        fetchOptions()
    }, [])

    // Fetch data when filters or bounds change
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                // Check if filters are in default state (User hasn't interacted yet)
                const isDefault =
                    !filters.neighborhood &&
                    filters.minPrice === 0 &&
                    filters.maxPrice === 5000000 &&
                    filters.propertyType.length === 0 &&
                    filters.tenure.length === 0 &&
                    !filters.minYear &&
                    !filters.maxYear &&
                    !polygonFilter &&
                    !currentBounds; // Added currentBounds check

                if (isDefault) {
                    setTransactions([])
                    setListings([])
                    setMetrics({
                        avgPrice: 0,
                        avgPsf: 0,
                        totalTransactions: 0,
                        minPrice: 0,
                        maxPrice: 0
                    })
                    setLoading(false)
                    return
                }

                // Prepare filter object for API
                const apiFilters: any = {}
                if (filters.neighborhood) apiFilters.neighborhood = filters.neighborhood
                // if (filters.searchQuery) apiFilters.searchQuery = filters.searchQuery // Removed Search Query
                if (filters.minPrice > 0) apiFilters.minPrice = filters.minPrice
                if (filters.maxPrice < 5000000) apiFilters.maxPrice = filters.maxPrice
                if (filters.propertyType.length > 0) apiFilters.propertyType = filters.propertyType
                if (filters.tenure.length > 0) apiFilters.tenure = filters.tenure

                if (filters.minYear) apiFilters.minYear = filters.minYear
                if (filters.maxYear) apiFilters.maxYear = filters.maxYear

                // Determine Bounds: Priority to Polygon, else Viewport
                if (polygonFilter && polygonFilter.length > 0) {
                    // Calculate bounds of the polygon
                    const lats = polygonFilter.map(p => p.lat)
                    const lngs = polygonFilter.map(p => p.lng)
                    apiFilters.bounds = {
                        minLat: Math.min(...lats),
                        maxLat: Math.max(...lats),
                        minLng: Math.min(...lngs),
                        maxLng: Math.max(...lngs)
                    }
                } else if (currentBounds) {
                    apiFilters.bounds = currentBounds
                }

                // Prepare Listing Filters
                const listingFilters: any = {
                    location: filters.neighborhood
                        ? filters.neighborhood // If neighborhood selected, filter by it
                        : (apiFilters.bounds ? undefined : 'Kuala Lumpur'), // Fallback to KL if no bounds? Or rely on bounds if we had bounds search support.
                    // Currently searchProperties doesn't support bounds, so we might fetch too many or need to filter client side or add bounds support.
                    // For now, let's use the neighborhood as primary location filter if set.
                    minPrice: filters.minPrice > 0 ? filters.minPrice : undefined,
                    maxPrice: filters.maxPrice < 5000000 ? filters.maxPrice : undefined,
                    // propertyType: filters.propertyType.length > 0 ? filters.propertyType[0] : undefined, // searchProperties takes string, our filter is array. Pick first?
                    // Listing type logic? For now fetch 'sale'
                    listingType: 'sale'
                }

                // Note: searchProperties logic in database.ts is mainly "location"-string based or exact matches.
                // It doesn't fully mirror the complex transaction filters (like multi-select types).
                // We will do a best-effort fetch here.

                // If we display by bounds, we really should fetch listings by bounds.
                // But existing `searchProperties` doesn't support bounds. 
                // Let's rely on Client-side bounds filtering for listings if we fetch a reasonable set (e.g. by Neighborhood).
                // If no neighborhood, we might be fetching default active listings.

                const [txs, mets, lsts] = await Promise.all([
                    getTransactions(1, 2000, apiFilters), // Increased limit to 2000 per request
                    getTransactionMetrics(apiFilters),
                    // Fetch listings if reasonable context exists (neighborhood or bounds imply logic, but let's try generic search)
                    searchProperties(listingFilters)
                ])
                setTransactions(txs)
                setMetrics(mets)
                setListings(lsts)

            } catch (error) {
                console.error('Error loading map data:', error)
            } finally {
                setLoading(false)
            }
        }

        const debounceTimer = setTimeout(fetchData, 500)
        return () => clearTimeout(debounceTimer)
    }, [filters, polygonFilter, currentBounds]) // Added currentBounds to trigger fetch on map move

    const toggleFilterDropdown = (name: string) => {
        setOpenFilter(prev => prev === name ? null : name)
    }

    const setRecency = (label: string, min?: number, max?: number) => {
        setFilters(prev => ({
            ...prev,
            recencyLabel: label,
            minYear: min,
            maxYear: max
        }))
        setOpenFilter(null)
    }

    const toggleFilter = (category: 'propertyType' | 'tenure', value: string) => {
        setFilters(prev => {
            const current = prev[category]
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value]
            return { ...prev, [category]: updated }
        })
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
            <Navbar />

            <main className="flex-grow flex flex-col h-[calc(100vh-80px)] relative">

                {/* Mobile Top Bar */}
                <div className="md:hidden bg-white border-b shadow-sm z-[2000] px-3 py-2 flex items-center gap-2">
                    <div className="relative flex-grow">
                        <select
                            value={filters.neighborhood}
                            onChange={(e) => setFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
                            className="form-select w-full text-sm py-2 pl-3 pr-8 rounded-lg border-gray-300 bg-white hover:border-primary-500 focus:ring-primary-500 cursor-pointer font-medium text-gray-700 shadow-sm"
                        >
                            <option value="">All Neighborhoods</option>
                            {neighborhoods.map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setShowMobileFilters(true)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all ${(filters.minPrice > 0 || filters.maxPrice < 5000000 || filters.propertyType.length > 0)
                                ? 'bg-primary-50 border-primary-200 text-primary-700'
                                : 'bg-white border-gray-200 text-gray-700'
                            }`}
                        title="Filters"
                    >
                        <Filter size={18} />
                    </button>
                    <button
                        onClick={() => setIsDrawing(!isDrawing)}
                        className={`flex items-center justify-center w-10 h-10 rounded-lg border transition-all ${isDrawing ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200'}`}
                        title={polygonFilter ? "Redraw Area" : "Draw Search Area"}
                    >
                        <span>✏️</span>
                    </button>
                    {/* Reset Button (only if filters active) */}
                    {(filters.neighborhood || filters.minPrice > 0 || filters.maxPrice < 5000000 || filters.propertyType.length > 0 || polygonFilter) &&
                        <button
                            onClick={() => {
                                setFilters({
                                    neighborhood: '',
                                    minPrice: 0,
                                    maxPrice: 5000000,
                                    propertyType: [],
                                    tenure: [],
                                    minYear: undefined,
                                    maxYear: undefined,
                                    recencyLabel: 'Date'
                                })
                                setPolygonFilter(null)
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100"
                            title="Reset All"
                        >
                            <span className="text-sm">↺</span>
                        </button>
                    }
                </div>

                {/* Desktop Top Filter Bar */}
                <div className="hidden md:flex bg-white border-b shadow-sm z-[2000] px-4 py-3 items-center gap-3">

                    {/* Filter Group: Left Aligned */}
                    <div className="flex items-center gap-2 flex-wrap">

                        {/* Neighborhood Dropdown - Prominent */}
                        <div className="relative min-w-[200px]">
                            <select
                                value={filters.neighborhood}
                                onChange={(e) => setFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
                                className="form-select w-full text-sm py-2 pl-3 pr-8 rounded-lg border-gray-300 bg-white hover:border-primary-500 focus:ring-primary-500 cursor-pointer font-medium text-gray-700 shadow-sm"
                            >
                                <option value="">All Neighborhoods</option>
                                {neighborhoods.map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>

                        <div className="h-6 w-px bg-gray-300 mx-2 hidden md:block"></div>

                        {/* Recency Filter (New) */}
                        <div className="relative">
                            <button
                                onClick={() => toggleFilterDropdown('recency')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${filters.recencyLabel !== 'Date' ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
                            >
                                <span>📅 {filters.recencyLabel}</span>
                                <span className="text-[10px] opacity-60">▼</span>
                            </button>

                            {openFilter === 'recency' && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-fade-in">
                                        <button onClick={() => setRecency('Date')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">All Time</button>
                                        <button onClick={() => setRecency('2024', 2024, 2024)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">2024</button>
                                        <button onClick={() => setRecency('2023', 2023, 2023)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">2023</button>
                                        <button onClick={() => setRecency('2022', 2022, 2022)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">2022</button>
                                        <div className="border-t my-1"></div>
                                        <button onClick={() => setRecency('Last 2 Years', 2023, 2024)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Last 2 Years</button>
                                        <button onClick={() => setRecency('Last 5 Years', 2020, 2024)} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700">Last 5 Years</button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Price Filter Popover */}
                        <div className="relative">
                            <button
                                onClick={() => toggleFilterDropdown('price')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${filters.maxPrice < 5000000 || filters.minPrice > 0 ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
                            >
                                <span>Price</span>
                                <span className="text-[10px] opacity-60">▼</span>
                            </button>

                            {openFilter === 'price' && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20 animate-fade-in">
                                        <h3 className="font-bold text-gray-900 mb-3 text-sm">Price Range</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Range</span>
                                                    <span className="font-semibold text-primary-700">
                                                        RM {(filters.minPrice / 1000).toFixed(0)}k - {filters.maxPrice >= 5000000 ? 'Any' : `RM ${(filters.maxPrice / 1000).toFixed(0)}k`}
                                                    </span>
                                                </div>
                                                <RangeSlider
                                                    min={0}
                                                    max={5000000}
                                                    step={50000}
                                                    value={[filters.minPrice, filters.maxPrice]}
                                                    onChange={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                                                    className="w-full mt-2"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <button onClick={() => setOpenFilter(null)} className="text-xs font-bold text-primary-600 hover:text-primary-700">Done</button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Property Type Popover */}
                        <div className="relative">
                            <button
                                onClick={() => toggleFilterDropdown('type')}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${filters.propertyType.length > 0 ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'}`}
                            >
                                <span>Type {filters.propertyType.length > 0 && `(${filters.propertyType.length})`}</span>
                                <span className="text-[10px] opacity-60">▼</span>
                            </button>

                            {openFilter === 'type' && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setOpenFilter(null)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-20 animate-fade-in max-h-96 overflow-y-auto">
                                        <h3 className="font-bold text-gray-900 mb-3 text-sm">Property Type</h3>
                                        <div className="space-y-2">
                                            {propertyTypes.map(type => (
                                                <label key={type} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={filters.propertyType.includes(type)}
                                                        onChange={() => toggleFilter('propertyType', type)}
                                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                    />
                                                    <span className="text-sm text-gray-600">{type}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Remove Calculator Tool Button */}

                        {/* Draw Button */}

                        {/* Draw Button */}
                        <button
                            onClick={() => setIsDrawing(!isDrawing)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all font-medium ${isDrawing ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                            title={polygonFilter ? "Redraw Area" : "Draw Search Area"}
                        >
                            <span>{isDrawing ? 'Drawing...' : (polygonFilter ? '✏️ Redraw' : '✏️ Draw Area')}</span>
                        </button>
                    </div>

                    <div className="flex-grow"></div>

                    {/* Right Side Metrics (Condensed) */}
                    <div className="hidden lg:flex items-center gap-6 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Avg Price</span>
                            <span className="font-bold text-gray-900">RM{(displayMetrics.avgPrice / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Avg PSF</span>
                            <span className="font-bold text-gray-900">{displayMetrics.avgPsf ? `RM${displayMetrics.avgPsf.toFixed(0)}` : '-'}</span>
                        </div>
                        <div className="w-px h-6 bg-gray-200"></div>
                        <div className="flex flex-col items-center leading-none">
                            <span className="text-[10px] uppercase font-bold text-gray-400">Count</span>
                            <span className="font-bold text-gray-900">{displayMetrics.totalTransactions}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setFilters({
                                neighborhood: '',
                                // searchQuery: '',
                                minPrice: 0,
                                maxPrice: 5000000,
                                propertyType: [],
                                tenure: [],
                                minYear: undefined,
                                maxYear: undefined,
                                recencyLabel: 'Date'
                            })
                            setPolygonFilter(null) // Reset polygon too
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Reset All Filters"
                    >
                        ↺
                    </button>
                </div>

                {/* Map Area */}
                <div className="flex-grow relative w-full h-full">
                    {loading && (
                        <div className="absolute top-4 right-4 z-[1000]">
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></div>
                                <span className="text-xs font-medium text-primary-700">Updating map...</span>
                            </div>
                        </div>
                    )}
                    <TransactionMap
                        transactions={displayTransactions}
                        listings={displayListings} // Pass filtered listings
                        hoveredId={hoveredId}
                        onHover={setHoveredId}
                        colorMode={colorMode}
                        onColorModeChange={setColorMode}
                        onBoundsChange={setCurrentBounds}
                        onPolygonComplete={setPolygonFilter}
                        polygon={polygonFilter}
                        isDrawing={isDrawing}
                        onDrawStop={() => setIsDrawing(false)}
                        onSelectTransaction={(transaction) => {
                            setSelectedTransaction(transaction)
                            setSelectedListing(null)
                        }}
                        onSelectListing={(listing) => {
                            setSelectedListing(listing)
                            setSelectedTransaction(null)
                        }}
                        className="w-full h-full"
                    />
                </div>

                {/* Draw Control Hint Overlay */}
                {isDrawing ? (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[2000] bg-gray-900/80 text-white px-4 py-2 rounded-full backdrop-blur-sm shadow-lg text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
                        <span>✏️ Click on map to draw points. Click first point to finish.</span>
                        <button onClick={() => setIsDrawing(false)} className="ml-2 hover:bg-white/20 p-1 rounded-full"><X size={14} /></button>
                    </div>
                ) : !polygonFilter && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 text-gray-700 px-4 py-2 rounded-full backdrop-blur-sm shadow-md border border-gray-200 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-4 pointer-events-none select-none">
                        <span>💡 Tip: Use the <b>Draw Area</b> tool to filter properties</span>
                    </div>
                )}
            </main>

            {/* Modals & Drawers */}
            {/* Calculator Modal Removed */}

            <TransactionDrawer
                transaction={selectedTransaction}
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
            />

            <ListingDrawer
                listing={selectedListing}
                isOpen={!!selectedListing}
                onClose={() => setSelectedListing(null)}
            />

            {/* Mobile Filter Drawer */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-[3000]">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowMobileFilters(false)}
                    ></div>

                    {/* Drawer Content */}
                    <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 space-y-8">
                            {/* Price Range */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Price Range</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Min: RM {(filters.minPrice / 1000).toFixed(0)}k</span>
                                        <span>Max: {filters.maxPrice >= 5000000 ? 'Any' : `RM ${(filters.maxPrice / 1000).toFixed(0)}k`}</span>
                                    </div>
                                    <RangeSlider
                                        min={0}
                                        max={5000000}
                                        step={50000}
                                        value={[filters.minPrice, filters.maxPrice]}
                                        onChange={([min, max]) => setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* Property Type */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Property Type</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {propertyTypes.map(type => (
                                        <label key={type} className={`flex items-center justify-center px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${filters.propertyType.includes(type)
                                                ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                checked={filters.propertyType.includes(type)}
                                                onChange={() => toggleFilter('propertyType', type)}
                                                className="hidden" // Hide default checkbox, use styling
                                            />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Recency */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Recency</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {['2024', '2023', 'Last 2 Years', 'Last 5 Years'].map((label) => {
                                        const isActive = filters.recencyLabel === label;
                                        return (
                                            <button
                                                key={label}
                                                onClick={() => {
                                                    if (label === '2024') setRecency(label, 2024, 2024);
                                                    else if (label === '2023') setRecency(label, 2023, 2023);
                                                    else if (label === 'Last 2 Years') setRecency(label, 2023, 2024);
                                                    else if (label === 'Last 5 Years') setRecency(label, 2020, 2024);
                                                }}
                                                className={`px-3 py-2 rounded-lg border text-sm transition-all ${isActive
                                                        ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {label}
                                            </button>
                                        )
                                    })}
                                    <button
                                        onClick={() => setRecency('Date')}
                                        className={`px-3 py-2 rounded-lg border text-sm transition-all ${filters.recencyLabel === 'Date'
                                                ? 'bg-primary-50 border-primary-200 text-primary-700 font-medium'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        All Time
                                    </button>
                                </div>
                            </div>

                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="w-full bg-primary-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-primary-700 transition-transform active:scale-95"
                            >
                                Show Results
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetricCard({ label, value, icon }: { label: string, value: string, icon: string }) {
    return (
        <div className="bg-gray-50 rounded-lg p-3 flex items-center space-x-3 border border-gray-100">
            <div className="text-2xl">{icon}</div>
            <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
                <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
        </div>
    )
}
