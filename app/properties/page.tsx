'use client'

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import Pagination from '@/components/Pagination'
import FilterModal from '@/components/FilterModal'
import FilterChips from '@/components/FilterChips'
import { ListSkeleton } from '@/components/SkeletonLoader'
import EmptyState from '@/components/EmptyState'
import SearchInput from '@/components/SearchInput'

// Dynamic imports for map components - only loaded when map view is active
const PropertyMap = dynamic(
    () => import('@/components/PropertyMap').then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2\" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-gray-500 text-sm">Loading map...</span>
                </div>
            </div>
        )
    }
)

const MapPropertyCard = dynamic(
    () => import('@/components/MapPropertyCard'),
    { ssr: false }
)

// Type import for MapBounds (doesn't affect bundle)
import type { MapBounds } from '@/components/PropertyMap'
import { getPropertiesPaginated, getDistinctStates, getFilterOptions, searchAgents, getPropertiesByAgentIds, getPropertyById } from '@/app/actions/property-actions'
import { Property, Agent } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'
import { generatePropertyUrl } from '@/lib/slugUtils'

const PROPERTIES_PER_PAGE = 12

interface FilterOptions {
    propertyTypes: string[]
    locations: string[]
    bedrooms: number[]
    priceRange: { min: number; max: number }
}

// Loading fallback for Suspense
function PropertiesPageLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="container-custom py-4">
                    <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
            </div>
            <div className="container-custom py-6">
                <ListSkeleton count={6} type="property" />
            </div>
            <Footer />
        </div>
    )
}

// Main page wrapper with Suspense
export default function PropertiesPage() {
    return (
        <Suspense fallback={<PropertiesPageLoading />}>
            <PropertiesPageContent />
        </Suspense>
    )
}

function PropertiesPageContent() {
    // URL Search Params
    const searchParams = useSearchParams()
    const router = useRouter()

    // View Mode Initialization from URL
    const initialViewMode = (searchParams.get('view') as 'grid' | 'list') || 'grid'
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)

    // ... (rest of state items are fine)
    const { user } = useAuth()
    const [properties, setProperties] = useState<Property[]>([])
    const [matchedAgents, setMatchedAgents] = useState<Agent[]>([])
    const [agentProperties, setAgentProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    // Get initial page from URL or default to 1
    const initialPage = parseInt(searchParams.get('page') || '1', 10)
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [totalCount, setTotalCount] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [sortBy, setSortBy] = useState('newest')
    const [activeTab, setActiveTab] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [mapView, setMapView] = useState(false)
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [visibleMapPropertyIds, setVisibleMapPropertyIds] = useState<string[] | null>(null) // null = show all
    // ...

    // Update view mode handler to persist to URL
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', mode)
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Sync state if URL changes externally (e.g. back button)
    useEffect(() => {
        const viewFromUrl = searchParams.get('view') as 'grid' | 'list'
        if (viewFromUrl && viewFromUrl !== viewMode) {
            setViewMode(viewFromUrl)
        }
    }, [searchParams, viewMode])

    // ... rest of component logic ...

    // (Inside render, update ListSkeleton usage)
    // <ListSkeleton count={12} type="property" viewMode={viewMode} />

    // (Inside render, update View Toggle buttons to use handleViewModeChange)
    // onClick={() => handleViewModeChange('grid')}
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        location: '',
        state: '', // Malaysian state filter
    })
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        propertyTypes: [],
        locations: [],
        bedrooms: [],
        priceRange: { min: 0, max: 10000000 }
    })
    const [loadingFilters, setLoadingFilters] = useState(true)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [filterModalOpen, setFilterModalOpen] = useState(false)
    const [stateOptions, setStateOptions] = useState<string[]>([])
    const [mobileSearchExpanded, setMobileSearchExpanded] = useState(true)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const initialLoadDone = useRef(false)

    // Handler for map bounds changes - separate to prevent map re-renders
    const handleMapBoundsChange = useCallback((bounds: MapBounds, visibleIds: string[]) => {
        setVisibleMapPropertyIds(visibleIds)
    }, [])

    const handlePropertySelect = useCallback(async (id: string) => {
        // Fetch property to generate slug URL 
        const property = await getPropertyById(id)
        if (property) {
            router.push(generatePropertyUrl(property))
        } else {
            // Fallback to old URL if property not found
            router.push(`/properties/${id}`)
        }
    }, [router])

    const loadProperties = useCallback(async (page: number, resetList: boolean = false, overrideFilters?: typeof filters) => {
        const activeFilters = overrideFilters || filters
        const hasActiveFilters = activeFilters.location || activeFilters.state || activeFilters.propertyType ||
            activeFilters.minPrice || activeFilters.maxPrice || activeFilters.bedrooms

        try {
            if (page === 1 || resetList) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            const result = await getPropertiesPaginated(page, PROPERTIES_PER_PAGE, {
                location: activeFilters.location || undefined,
                state: activeFilters.state || undefined,
                propertyType: activeFilters.propertyType || undefined,
                minPrice: activeFilters.minPrice ? Number(activeFilters.minPrice) : undefined,
                maxPrice: activeFilters.maxPrice ? Number(activeFilters.maxPrice) : undefined,
                bedrooms: activeFilters.bedrooms ? Number(activeFilters.bedrooms) : undefined,
                listingType: 'sale', // Only show properties for sale, not rent
            })

            setProperties(result.properties)
            setTotalCount(result.totalCount)
            setHasMore(result.hasMore)
            setCurrentPage(page)
        } catch (error) {
            console.error('Error loading properties:', error)
            setProperties([])
            setTotalCount(0)
            setHasMore(false)
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [filters])

    // Initialize filters from URL params AND trigger load
    useEffect(() => {
        const stateParam = searchParams.get('state')
        const locationParam = searchParams.get('location')
        const searchParam = searchParams.get('search')
        const typeParam = searchParams.get('type')
        const priceParam = searchParams.get('price')
        const bedroomsParam = searchParams.get('bedrooms')
        const listingParam = searchParams.get('listing')

        const hasAnyParam = stateParam || locationParam || searchParam || typeParam || priceParam || bedroomsParam

        if (hasAnyParam) {
            // Parse price range (e.g., "500000-800000" or "2000000+")
            let minPrice = ''
            let maxPrice = ''
            if (priceParam) {
                if (priceParam.endsWith('+')) {
                    minPrice = priceParam.slice(0, -1)
                } else if (priceParam.includes('-')) {
                    const [min, max] = priceParam.split('-')
                    minPrice = min
                    maxPrice = max
                }
            }

            // Map property type values from home page to properties page format
            const propertyTypeMap: { [key: string]: string } = {
                'condo': 'Condominium',
                'apartment': 'Apartment',
                'terrace': 'Terrace House',
                'semi-d': 'Semi-D',
                'bungalow': 'Bungalow',
                'townhouse': 'Townhouse',
                'all': '',
            }
            const mappedPropertyType = typeParam ? (propertyTypeMap[typeParam] || typeParam) : ''

            // Handle bedroom values (e.g., "5+" becomes "5")
            const bedroomValue = bedroomsParam ? bedroomsParam.replace('+', '') : ''

            setFilters(prev => ({
                ...prev,
                state: stateParam || '',
                location: locationParam || searchParam || '',
                propertyType: mappedPropertyType,
                minPrice: minPrice,
                maxPrice: maxPrice,
                bedrooms: bedroomValue,
            }))
            // Mark that we need to load after filter update
            initialLoadDone.current = false

            // Also search for agents if there's a search query
            if (searchParam && searchParam.trim().length >= 2) {
                searchAgents(searchParam).then(async (agents) => {
                    setMatchedAgents(agents)
                    // Fetch properties from matched agents
                    if (agents.length > 0) {
                        const agentIds = agents.map(a => a.id || a.agent_id).filter((id): id is string => !!id)
                        const props = await getPropertiesByAgentIds(agentIds, 12)
                        setAgentProperties(props)
                    } else {
                        setAgentProperties([])
                    }
                })
            } else {
                setMatchedAgents([])
                setAgentProperties([])
            }
        } else if (!initialLoadDone.current) {
            // No URL params, just do initial load
            loadProperties(1, true)
            setMatchedAgents([])
            setAgentProperties([])
            initialLoadDone.current = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]) // loadProperties intentionally omitted to prevent infinite loops

    // Load when filters are updated from URL params
    useEffect(() => {
        const hasFilters = filters.state || filters.location || filters.propertyType || filters.minPrice || filters.maxPrice || filters.bedrooms
        if (!initialLoadDone.current && hasFilters) {
            loadProperties(1, true)
            initialLoadDone.current = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.state, filters.location, filters.propertyType, filters.minPrice, filters.maxPrice, filters.bedrooms]) // loadProperties intentionally omitted

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Load filter options from database
    useEffect(() => {
        async function loadFilterOptions() {
            try {
                const [options, states] = await Promise.all([
                    getFilterOptions(),
                    getDistinctStates()
                ])
                setFilterOptions(options)
                setStateOptions(states)
            } catch (error) {
                console.error('Error loading filter options:', error)
            } finally {
                setLoadingFilters(false)
            }
        }
        loadFilterOptions()
    }, [])

    // Helper function to sync filters to URL for back button support
    const syncFiltersToUrl = useCallback((filterState: typeof filters) => {
        const params = new URLSearchParams()
        if (filterState.state) params.set('state', filterState.state)
        if (filterState.location) params.set('search', filterState.location)
        if (filterState.propertyType) params.set('type', filterState.propertyType)
        if (filterState.minPrice && filterState.maxPrice) {
            params.set('price', `${filterState.minPrice}-${filterState.maxPrice}`)
        } else if (filterState.minPrice) {
            params.set('price', `${filterState.minPrice}+`)
        } else if (filterState.maxPrice) {
            params.set('price', `0-${filterState.maxPrice}`)
        }
        if (filterState.bedrooms) params.set('bedrooms', filterState.bedrooms)

        const queryString = params.toString()
        router.replace(`/properties${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }, [router])

    // Reload when filters change
    const handleApplyFilters = (overrideFilters?: typeof filters) => {
        const activeFilters = overrideFilters || filters
        setCurrentPage(1)
        loadProperties(1, true, activeFilters)
        setShowFilters(false)
        syncFiltersToUrl(activeFilters)

        // Search for agents if there's a location/search query
        if (activeFilters.location && activeFilters.location.trim().length >= 2) {
            searchAgents(activeFilters.location).then(agents => {
                setMatchedAgents(agents)
            })
        } else {
            setMatchedAgents([])
        }
    }

    const handleResetFilters = () => {
        const resetFilters = { propertyType: '', minPrice: '', maxPrice: '', bedrooms: '', location: '', state: '' }
        setFilters(resetFilters)
        setCurrentPage(1)
        setMatchedAgents([])
        setOpenDropdown(null)

        // Clear URL params
        router.replace('/properties', { scroll: false })

        // Load with reset filters immediately
        loadProperties(1, true, resetFilters)
    }

    const handlePageChange = (page: number) => {
        // Update URL with the new page number while preserving other params
        const params = new URLSearchParams(searchParams.toString())
        if (page > 1) {
            params.set('page', page.toString())
        } else {
            params.delete('page')
        }
        const queryString = params.toString()
        router.push(`/properties${queryString ? `?${queryString}` : ''}`, { scroll: false })

        loadProperties(page, true)
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSaveSearch = () => {
        if (!user) {
            // Redirect to login page if user is not logged in
            router.push('/login?message=' + encodeURIComponent('Please login to save your search and get notified of new matching properties.'))
            return
        }

        // User is logged in - show success message (future: save to database)
        alert('Search saved! We\'ll notify you when new properties match your criteria. You can view your saved searches in your profile.')
        // TODO: Implement actual save to database/user preferences
    }

    const totalPages = Math.ceil(totalCount / PROPERTIES_PER_PAGE)

    // Create a set of agent property IDs for deduplication
    const agentPropertyIds = useMemo(() => new Set(agentProperties.map(p => p.id)), [agentProperties])

    // Sort properties client-side and filter out those already shown in agent section
    const sortedProperties = useMemo(() => {
        return [...properties]
            .filter(p => !agentPropertyIds.has(p.id)) // Remove duplicates
            .sort((a, b) => {
                if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0)
                if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0)
                return new Date(b.created_at || b.scraped_at || 0).getTime() - new Date(a.created_at || a.scraped_at || 0).getTime()
            })
    }, [properties, agentPropertyIds, sortBy])

    // Generate dynamic filter options from database
    const propertyTypeOptions = [
        { label: 'All Residential', value: '' },
        ...filterOptions.propertyTypes.map(type => ({ label: type, value: type }))
    ]

    // Static price range options for consistent UX
    const priceRanges = [
        { label: 'Any Price', min: '', max: '' },
        { label: 'Under RM300K', min: '', max: '300000' },
        { label: 'RM300K - RM500K', min: '300000', max: '500000' },
        { label: 'RM500K - RM800K', min: '500000', max: '800000' },
        { label: 'RM800K - RM1M', min: '800000', max: '1000000' },
        { label: 'RM1M - RM2M', min: '1000000', max: '2000000' },
        { label: 'RM2M - RM3M', min: '2000000', max: '3000000' },
        { label: 'RM3M - RM5M', min: '3000000', max: '5000000' },
        { label: 'Above RM5M', min: '5000000', max: '' },
    ]

    // Bedroom options based on actual data
    const bedroomOptions = [
        { label: 'Any', value: '' },
        ...filterOptions.bedrooms.map(bed => ({ label: String(bed), value: String(bed) }))
    ]

    const activeFilterCount = [
        filters.propertyType,
        filters.minPrice || filters.maxPrice,
        filters.bedrooms,
        filters.location,
    ].filter(Boolean).length

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Search Filters Bar - PropertyGuru Style */}
            <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
                {/* Mobile Toggle Button */}
                <button
                    onClick={() => setMobileSearchExpanded(!mobileSearchExpanded)}
                    className="md:hidden w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                    {mobileSearchExpanded ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Hide Search & Filters
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Show Search & Filters
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </>
                    )}
                </button>

                {/* Collapsible Search Section - Always visible on desktop, toggleable on mobile */}
                <div className={`container-custom py-4 ${!mobileSearchExpanded ? 'hidden md:block' : ''}`}>
                    {/* Search Input + Save Search */}
                    <div className="flex gap-4 mb-4">
                        <SearchInput
                            value={filters.location}
                            onChange={(val) => setFilters({ ...filters, location: val })}
                            onSearch={(val) => {
                                const newFilters = { ...filters, location: val }
                                setFilters(newFilters)
                                handleApplyFilters(newFilters)
                            }}
                            placeholder="Search location, project, or area..."
                            className="flex-1"
                        />
                        <button
                            onClick={() => handleApplyFilters()}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span className="font-medium hidden sm:inline">Search</span>
                        </button>
                    </div>

                    {/* Quick Filter Pills */}
                    <div ref={dropdownRef} className="flex items-center gap-3 flex-wrap">
                        {/* Filters Button */}
                        <button
                            onClick={() => setFilterModalOpen(true)}
                            className={`filter-pill ${activeFilterCount > 0 ? 'active' : ''}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            <span>Filters</span>
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {/* Property Type Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'propertyType' ? null : 'propertyType')}
                                className={`filter-pill ${filters.propertyType ? 'active' : ''}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{filters.propertyType || 'All Residential'}</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'propertyType' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'propertyType' && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                                    {propertyTypeOptions.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() => {
                                                const newFilters = { ...filters, propertyType: type.value }
                                                setFilters(newFilters)
                                                setOpenDropdown(null)
                                                loadProperties(1, true, newFilters)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.propertyType === type.value ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Price Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'price' || openDropdown === 'priceMin' || openDropdown === 'priceMax' ? null : 'price')}
                                className={`filter-pill ${filters.minPrice || filters.maxPrice ? 'active' : ''}`}
                            >
                                <span className="font-medium">RM</span>
                                <span>
                                    {filters.minPrice || filters.maxPrice
                                        ? filters.minPrice && filters.maxPrice
                                            ? `${parseInt(filters.minPrice).toLocaleString()} - ${parseInt(filters.maxPrice).toLocaleString()}`
                                            : filters.minPrice
                                                ? `${parseInt(filters.minPrice).toLocaleString()}+`
                                                : `≤ ${parseInt(filters.maxPrice).toLocaleString()}`
                                        : 'Price'}
                                </span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'price' || openDropdown === 'priceMin' || openDropdown === 'priceMax' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {(openDropdown === 'price' || openDropdown === 'priceMin' || openDropdown === 'priceMax') && (
                                <div className="absolute top-full left-0 mt-2 w-[400px] bg-white rounded-2xl shadow-xl border border-gray-200 p-5 z-50">
                                    {/* Labels Row */}
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <label className="text-sm font-medium text-gray-900">Minimum</label>
                                        <label className="text-sm font-medium text-gray-900">Maximum</label>
                                    </div>

                                    {/* Input Fields Row */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {/* Min Input with Dropdown */}
                                        <div className="relative">
                                            <div
                                                className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white hover:border-gray-400 transition-colors"
                                            >
                                                <span className="text-gray-500 mr-2 text-sm font-medium">RM</span>
                                                <input
                                                    type="text"
                                                    placeholder="Min"
                                                    value={filters.minPrice ? parseInt(filters.minPrice).toLocaleString() : ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/,/g, '').replace(/\D/g, '')
                                                        setFilters({ ...filters, minPrice: value })
                                                    }}
                                                    onFocus={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown('priceMin')
                                                    }}
                                                    className="flex-1 text-gray-700 text-sm bg-transparent outline-none w-full"
                                                />
                                                <svg
                                                    className={`w-4 h-4 text-gray-400 transition-transform cursor-pointer ${openDropdown === 'priceMin' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown(openDropdown === 'priceMin' ? 'price' : 'priceMin')
                                                    }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            {openDropdown === 'priceMin' && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[60] max-h-60 overflow-y-auto">
                                                    {[
                                                        { label: 'No Min', value: '' },
                                                        { label: '200,000', value: '200000' },
                                                        { label: '300,000', value: '300000' },
                                                        { label: '400,000', value: '400000' },
                                                        { label: '500,000', value: '500000' },
                                                        { label: '600,000', value: '600000' },
                                                        { label: '800,000', value: '800000' },
                                                        { label: '1,000,000', value: '1000000' },
                                                        { label: '1,500,000', value: '1500000' },
                                                        { label: '2,000,000', value: '2000000' },
                                                        { label: '3,000,000', value: '3000000' },
                                                        { label: '5,000,000', value: '5000000' },
                                                    ].map((opt) => (
                                                        <label
                                                            key={opt.value}
                                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="minPrice"
                                                                checked={filters.minPrice === opt.value}
                                                                onChange={() => {
                                                                    setFilters({ ...filters, minPrice: opt.value })
                                                                    setOpenDropdown('price')
                                                                }}
                                                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Max Input with Dropdown */}
                                        <div className="relative">
                                            <div
                                                className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white hover:border-gray-400 transition-colors"
                                            >
                                                <span className="text-gray-500 mr-2 text-sm font-medium">RM</span>
                                                <input
                                                    type="text"
                                                    placeholder="Max"
                                                    value={filters.maxPrice ? parseInt(filters.maxPrice).toLocaleString() : ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/,/g, '').replace(/\D/g, '')
                                                        setFilters({ ...filters, maxPrice: value })
                                                    }}
                                                    onFocus={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown('priceMax')
                                                    }}
                                                    className="flex-1 text-gray-700 text-sm bg-transparent outline-none w-full"
                                                />
                                                <svg
                                                    className={`w-4 h-4 text-gray-400 transition-transform cursor-pointer ${openDropdown === 'priceMax' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown(openDropdown === 'priceMax' ? 'price' : 'priceMax')
                                                    }}
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                            {openDropdown === 'priceMax' && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[60] max-h-60 overflow-y-auto">
                                                    {[
                                                        { label: 'No Max', value: '' },
                                                        { label: '300,000', value: '300000' },
                                                        { label: '400,000', value: '400000' },
                                                        { label: '500,000', value: '500000' },
                                                        { label: '600,000', value: '600000' },
                                                        { label: '800,000', value: '800000' },
                                                        { label: '1,000,000', value: '1000000' },
                                                        { label: '1,500,000', value: '1500000' },
                                                        { label: '2,000,000', value: '2000000' },
                                                        { label: '3,000,000', value: '3000000' },
                                                        { label: '5,000,000', value: '5000000' },
                                                        { label: '10,000,000', value: '10000000' },
                                                    ].map((opt) => (
                                                        <label
                                                            key={opt.value}
                                                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="maxPrice"
                                                                checked={filters.maxPrice === opt.value}
                                                                onChange={() => {
                                                                    setFilters({ ...filters, maxPrice: opt.value })
                                                                    setOpenDropdown('price')
                                                                }}
                                                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                                            />
                                                            <span className="text-sm text-gray-700">{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                const newFilters = { ...filters, minPrice: '', maxPrice: '' }
                                                setFilters(newFilters)
                                                loadProperties(1, true, newFilters)
                                                setOpenDropdown(null)
                                            }}
                                            className="py-2.5 px-4 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => {
                                                setOpenDropdown(null)
                                                loadProperties(1, true, filters)
                                                syncFiltersToUrl(filters)
                                            }}
                                            className="py-2.5 px-4 bg-primary-600 hover:bg-primary-700 rounded-full text-sm font-medium text-white transition-colors"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bedroom Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'bedroom' ? null : 'bedroom')}
                                className={`filter-pill ${filters.bedrooms ? 'active' : ''}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>{filters.bedrooms || 'Bedroom'}</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'bedroom' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'bedroom' && (
                                <div className="absolute top-full left-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                    {bedroomOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => {
                                                const newFilters = { ...filters, bedrooms: opt.value }
                                                setFilters(newFilters)
                                                setOpenDropdown(null)
                                                loadProperties(1, true, newFilters)
                                                syncFiltersToUrl(newFilters)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.bedrooms === opt.value ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* State Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
                                className={`filter-pill ${filters.state ? 'active' : ''}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{filters.state || 'State'}</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'state' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'state' && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => {
                                            const newFilters = { ...filters, state: '' }
                                            setFilters(newFilters)
                                            setOpenDropdown(null)
                                            loadProperties(1, true, newFilters)
                                            syncFiltersToUrl(newFilters)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.state ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        All States
                                    </button>
                                    {stateOptions.map((state) => (
                                        <button
                                            key={state}
                                            onClick={() => {
                                                const newFilters = { ...filters, state: state }
                                                setFilters(newFilters)
                                                setOpenDropdown(null)
                                                loadProperties(1, true, newFilters)
                                                syncFiltersToUrl(newFilters)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.state === state ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {state}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Clear Filters */}
                        {activeFilterCount > 0 && (
                            <button
                                onClick={handleResetFilters}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                            >
                                Clear all
                            </button>
                        )}
                    </div>
                </div>

                {/* Category Tabs - Hidden for now */}
                {/* <div className="container-custom">
                    <div className="search-tabs -mb-px">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`search-tab ${activeTab === 'all' ? 'active' : ''}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`search-tab ${activeTab === 'new' ? 'active' : ''}`}
                        >
                            New Projects
                        </button>
                        <button
                            onClick={() => setActiveTab('subsale')}
                            className={`search-tab ${activeTab === 'subsale' ? 'active' : ''}`}
                        >
                            Subsale
                        </button>
                    </div>
                </div> */}

            </div>

            <div className="container-custom py-6">
                {/* Results Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="page-title">
                            {loading ? 'Loading...' : `${totalCount.toLocaleString()} Properties for Sale`}
                        </h1>
                        {!loading && (
                            <>
                                {/* Filter Summary - shows when any filter is active */}
                                {(filters.propertyType || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.location || filters.state) && (
                                    <div className="mt-1 sm:mt-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-50 border-l-3 sm:border-l-4 border-primary-500 rounded-r-md sm:rounded-r-lg">
                                        <p className="text-gray-700 text-sm sm:text-base font-medium leading-snug">
                                            {(() => {
                                                const summaryParts = []

                                                // Property type (if selected)
                                                if (filters.propertyType) {
                                                    summaryParts.push(filters.propertyType)
                                                }

                                                // Price range
                                                if (filters.minPrice && filters.maxPrice) {
                                                    const minK = parseInt(filters.minPrice) >= 1000000
                                                        ? `RM ${(parseInt(filters.minPrice) / 1000000).toFixed(1)}M`
                                                        : `RM ${(parseInt(filters.minPrice) / 1000).toFixed(0)}K`
                                                    const maxK = parseInt(filters.maxPrice) >= 1000000
                                                        ? `RM ${(parseInt(filters.maxPrice) / 1000000).toFixed(1)}M`
                                                        : `RM ${(parseInt(filters.maxPrice) / 1000).toFixed(0)}K`
                                                    summaryParts.push(`Between ${minK} and ${maxK}`)
                                                } else if (filters.minPrice) {
                                                    const minK = parseInt(filters.minPrice) >= 1000000
                                                        ? `RM ${(parseInt(filters.minPrice) / 1000000).toFixed(1)}M`
                                                        : `RM ${(parseInt(filters.minPrice) / 1000).toFixed(0)}K`
                                                    summaryParts.push(`Above ${minK}`)
                                                } else if (filters.maxPrice) {
                                                    const maxK = parseInt(filters.maxPrice) >= 1000000
                                                        ? `RM ${(parseInt(filters.maxPrice) / 1000000).toFixed(1)}M`
                                                        : `RM ${(parseInt(filters.maxPrice) / 1000).toFixed(0)}K`
                                                    summaryParts.push(`Under ${maxK}`)
                                                }

                                                // Bedrooms
                                                if (filters.bedrooms) {
                                                    summaryParts.push(`${filters.bedrooms}+ Bedrooms`)
                                                }

                                                // Location/State
                                                if (filters.location) {
                                                    summaryParts.push(`in ${filters.location}`)
                                                } else if (filters.state) {
                                                    summaryParts.push(`in ${filters.state}`)
                                                }

                                                return summaryParts.length > 0 ? summaryParts.join(' • ') : ''
                                            })()}
                                        </p>
                                    </div>
                                )}
                                <p className="page-subtitle">
                                    Showing {properties.length} of {totalCount.toLocaleString()} results
                                </p>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Map View Toggle */}
                        <div className="map-toggle hidden md:flex">
                            <span className="text-sm text-gray-600 mr-2">Map View</span>
                            <button
                                onClick={() => {
                                    const newMapView = !mapView
                                    setMapView(newMapView)
                                    // Reset visible property filter when exiting map view
                                    if (!newMapView) {
                                        setVisibleMapPropertyIds(null)
                                    }
                                }}
                                className={`toggle-switch ${mapView ? 'active' : ''}`}
                            >
                                <span className="toggle-switch-thumb" />
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="view-toggle">
                            <button
                                onClick={() => handleViewModeChange('grid')}
                                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="sort-dropdown appearance-none pr-8"
                            >
                                <option value="newest">Newest</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Matched Agents Section */}
                {matchedAgents.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Matching Agents ({matchedAgents.length})
                            </h2>
                            <Link href="/agents" className="text-rose-500 text-sm font-medium hover:text-rose-600">
                                View All Agents →
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {matchedAgents.map((agent) => (
                                <Link
                                    key={agent.id || agent.agent_id}
                                    href={`/agents/${agent.id || agent.agent_id}`}
                                    className="bg-white rounded-xl p-4 border border-gray-200 hover:border-rose-300 hover:shadow-md transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        {agent.photo_url ? (
                                            <img
                                                src={agent.photo_url}
                                                alt={agent.name}
                                                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-rose-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold ring-2 ring-gray-100 group-hover:ring-rose-200">
                                                {agent.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate group-hover:text-rose-600">
                                                {agent.name}
                                            </h3>
                                            {agent.agency && (
                                                <p className="text-xs text-gray-500 truncate">
                                                    {agent.agency}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent Properties Section - Shown when agents match */}
                {!loading && agentProperties.length > 0 && matchedAgents.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Properties by {matchedAgents.length === 1 ? matchedAgents[0].name : 'Matching Agents'} ({agentProperties.length})
                            </h2>
                            {matchedAgents.length === 1 && (
                                <Link
                                    href={`/agents/${matchedAgents[0].id || matchedAgents[0].agent_id}`}
                                    className="text-rose-500 text-sm font-medium hover:text-rose-600"
                                >
                                    View Agent Profile →
                                </Link>
                            )}
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6 max-w-4xl mx-auto'}>
                            {agentProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} variant={viewMode} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Regular Properties Section */}
                {!loading && sortedProperties.length > 0 && !(matchedAgents.length > 0 && sortedProperties.length === 0) && (
                    <>
                        {/* Section header for regular properties when agent properties are also shown */}
                        {agentProperties.length > 0 && matchedAgents.length > 0 && (
                            <div className="mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Other Properties Matching Your Search ({sortedProperties.length})
                                </h2>
                            </div>
                        )}

                        {/* Map View - Premium Split Screen Layout */}
                        {mapView ? (
                            <div className="map-view-container rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                                {/* Sidebar - Property List */}
                                <div className={`map-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-0 min-w-0 opacity-0 overflow-hidden' : ''}`}>
                                    <div className="map-sidebar-header">
                                        <span className="map-sidebar-title">
                                            {visibleMapPropertyIds !== null
                                                ? `${visibleMapPropertyIds.length} of ${sortedProperties.length} Properties`
                                                : `${sortedProperties.length} Properties`}
                                        </span>
                                        <button
                                            onClick={() => setSidebarCollapsed(true)}
                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            aria-label="Collapse sidebar"
                                        >
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="map-sidebar-list">
                                        <div className="map-sidebar-content">
                                            {/* Filter properties based on visible map bounds */}
                                            {(visibleMapPropertyIds !== null
                                                ? sortedProperties.filter(p => visibleMapPropertyIds.includes(p.id))
                                                : sortedProperties
                                            ).map((property) => (
                                                <MapPropertyCard
                                                    key={property.id}
                                                    property={property}
                                                    isHovered={hoveredPropertyId === property.id}
                                                    onHover={setHoveredPropertyId}
                                                    onClick={(id) => handlePropertySelect(id)}
                                                />
                                            ))}
                                            {visibleMapPropertyIds !== null && visibleMapPropertyIds.length === 0 && (
                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                    No properties in this area. Try zooming out or panning the map.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Map Area */}
                                <div className="map-main">
                                    {/* Expand sidebar button (shown when collapsed) */}
                                    {sidebarCollapsed && (
                                        <button
                                            onClick={() => setSidebarCollapsed(false)}
                                            className="map-collapse-btn"
                                            aria-label="Expand sidebar"
                                        >
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    )}

                                    <PropertyMap
                                        properties={sortedProperties}
                                        hoveredPropertyId={hoveredPropertyId}
                                        onPropertyHover={setHoveredPropertyId}
                                        onPropertySelect={handlePropertySelect}
                                        onMarkerClick={handlePropertySelect}
                                        onBoundsChange={handleMapBoundsChange}
                                        className="h-full"
                                        showControls={true}
                                    />
                                </div>
                            </div>
                        ) : (
                            /* Grid/List View */
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6 max-w-4xl mx-auto'}>
                                {sortedProperties.map((property) => (
                                    <PropertyCard key={property.id} property={property} variant={viewMode} />
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}
                    </>
                )}

                {/* Loading State */}
                {loading && (
                    <ListSkeleton count={12} type="property" viewMode={viewMode} />
                )}

                {/* No Results - Only shown when both property search and agent search return nothing */}
                {!loading && sortedProperties.length === 0 && agentProperties.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h3 className="font-heading font-semibold text-xl text-gray-900 mb-2">
                            {filters.location ? `No results for "${filters.location}"` : 'No properties found'}
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            {filters.location
                                ? "We couldn't find any properties or agents matching your search. Try a different name or location."
                                : "We couldn't find any properties matching your criteria. Try adjusting your filters."
                            }
                        </p>
                        <button
                            onClick={handleResetFilters}
                            className="btn-primary"
                        >
                            Reset All Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Modal */}
            <FilterModal
                isOpen={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                filters={filters}
                onApply={(newFilters) => {
                    setFilters(newFilters)
                    loadProperties(1, true, newFilters)
                    syncFiltersToUrl(newFilters)
                }}
                filterOptions={filterOptions}
                stateOptions={stateOptions}
            />

            <Footer />
        </div>
    )
}
