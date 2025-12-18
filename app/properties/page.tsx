'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import Pagination from '@/components/Pagination'
import FilterModal from '@/components/FilterModal'
import FilterChips from '@/components/FilterChips'
import { ListSkeleton } from '@/components/SkeletonLoader'
import EmptyState from '@/components/EmptyState'
import { getPropertiesPaginated, getFilterOptions, searchAgents, getPropertiesByAgentIds } from '@/lib/database'
import { Property, Agent } from '@/lib/supabase'
import { mockProperties } from '@/lib/mockData'

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
    const searchParams = useSearchParams()
    const router = useRouter()
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('newest')
    const [activeTab, setActiveTab] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [mapView, setMapView] = useState(false)
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
    const dropdownRef = useRef<HTMLDivElement>(null)
    const initialLoadDone = useRef(false)

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
            })

            if (result.totalCount > 0) {
                setProperties(result.properties)
                setTotalCount(result.totalCount)
                setHasMore(result.hasMore)
                setCurrentPage(page)
            } else if (page === 1 && !hasActiveFilters) {
                // Only fallback to mock data if no filters AND database is empty
                setProperties(mockProperties)
                setTotalCount(mockProperties.length)
                setHasMore(false)
            } else {
                // Search/filter returned no results - show empty
                setProperties([])
                setTotalCount(0)
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading properties:', error)
            if (page === 1 && !hasActiveFilters) {
                setProperties(mockProperties)
                setTotalCount(mockProperties.length)
                setHasMore(false)
            } else {
                setProperties([])
                setTotalCount(0)
                setHasMore(false)
            }
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
                        const agentIds = agents.map(a => a.agent_id)
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
                const options = await getFilterOptions()
                setFilterOptions(options)
            } catch (error) {
                console.error('Error loading filter options:', error)
            } finally {
                setLoadingFilters(false)
            }
        }
        loadFilterOptions()
    }, [])

    // Reload when filters change
    const handleApplyFilters = () => {
        setCurrentPage(1)
        loadProperties(1, true)
        setShowFilters(false)

        // Search for agents if there's a location/search query
        if (filters.location && filters.location.trim().length >= 2) {
            searchAgents(filters.location).then(agents => {
                setMatchedAgents(agents)
            })
        } else {
            setMatchedAgents([])
        }
    }

    const handleResetFilters = () => {
        setFilters({ propertyType: '', minPrice: '', maxPrice: '', bedrooms: '', location: '', state: '' })
        setCurrentPage(1)
        setMatchedAgents([])
        // Need to load after state updates
        setTimeout(() => loadProperties(1, true), 0)
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

    const totalPages = Math.ceil(totalCount / PROPERTIES_PER_PAGE)

    // Sort properties client-side
    const sortedProperties = [...properties].sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price
        if (sortBy === 'price-high') return b.price - a.price
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Generate dynamic filter options from database
    const propertyTypeOptions = [
        { label: 'All Residential', value: '' },
        ...filterOptions.propertyTypes.map(type => ({ label: type, value: type }))
    ]

    // Generate price range options based on actual data
    const generatePriceRanges = () => {
        const { min, max } = filterOptions.priceRange
        const ranges = [
            { label: 'Any Price', min: '', max: '' }
        ]

        if (max > 0) {
            if (max >= 500000) ranges.push({ label: 'Under RM500K', min: '', max: '500000' })
            if (max >= 1000000) ranges.push({ label: 'RM500K - RM1M', min: '500000', max: '1000000' })
            if (max >= 2000000) ranges.push({ label: 'RM1M - RM2M', min: '1000000', max: '2000000' })
            if (max >= 3000000) ranges.push({ label: 'RM2M - RM3M', min: '2000000', max: '3000000' })
            if (max >= 5000000) ranges.push({ label: 'RM3M - RM5M', min: '3000000', max: '5000000' })
            if (max > 5000000) ranges.push({ label: 'Above RM5M', min: '5000000', max: '' })
            else if (max > 3000000) ranges.push({ label: `Above RM3M`, min: '3000000', max: '' })
            else if (max > 2000000) ranges.push({ label: 'Above RM2M', min: '2000000', max: '' })
        }

        return ranges
    }

    const priceRanges = generatePriceRanges()

    // Bedroom options based on actual data
    const bedroomOptions = [
        { label: 'Any', value: '' },
        ...filterOptions.bedrooms.map(bed => ({ label: `${bed}+`, value: String(bed) }))
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
                <div className="container-custom py-4">
                    {/* Search Input + Save Search */}
                    <div className="flex gap-4 mb-4">
                        <div className="flex-1 relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search location, project, or area..."
                                value={filters.location}
                                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-all"
                                suppressHydrationWarning
                            />
                        </div>
                        <button className="flex items-center gap-2 px-5 py-3 border border-gray-200 rounded-xl bg-white hover:border-primary-400 hover:bg-primary-50 transition-colors">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            <span className="font-medium text-gray-700 hidden sm:inline">Save Search</span>
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
                                onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                                className={`filter-pill ${filters.minPrice || filters.maxPrice ? 'active' : ''}`}
                            >
                                <span className="font-medium">RM</span>
                                <span>Price</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'price' && (
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                                    {priceRanges.map((range, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                const newFilters = { ...filters, minPrice: range.min, maxPrice: range.max }
                                                setFilters(newFilters)
                                                setOpenDropdown(null)
                                                loadProperties(1, true, newFilters)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.minPrice === range.min && filters.maxPrice === range.max ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
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
                                <span>{filters.bedrooms ? `${filters.bedrooms}+ Bed` : 'Bedroom'}</span>
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
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.bedrooms === opt.value ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {opt.label}
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

                {/* Category Tabs */}
                <div className="container-custom">
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
                </div>

                {/* Active Filter Chips */}
                <FilterChips
                    filters={[
                        filters.location ? { key: 'location', label: 'Location', value: filters.location } : null,
                        filters.state ? { key: 'state', label: 'State', value: filters.state } : null,
                        filters.propertyType ? { key: 'propertyType', label: 'Type', value: filters.propertyType } : null,
                        filters.minPrice || filters.maxPrice ? {
                            key: 'price',
                            label: 'Price',
                            value: filters.minPrice && filters.maxPrice
                                ? `RM${(parseInt(filters.minPrice) / 1000)}k - RM${(parseInt(filters.maxPrice) / 1000)}k`
                                : filters.minPrice
                                    ? `Above RM${(parseInt(filters.minPrice) / 1000)}k`
                                    : `Under RM${(parseInt(filters.maxPrice) / 1000)}k`
                        } : null,
                        filters.bedrooms ? { key: 'bedrooms', label: 'Bedrooms', value: `${filters.bedrooms}+` } : null,
                    ].filter(Boolean) as { key: string; label: string; value: string }[]}
                    onRemove={(key) => {
                        const newFilters = { ...filters }
                        if (key === 'price') {
                            newFilters.minPrice = ''
                            newFilters.maxPrice = ''
                        } else {
                            newFilters[key as keyof typeof filters] = ''
                        }
                        setFilters(newFilters)
                        loadProperties(1, true, newFilters)
                    }}
                    onClearAll={handleResetFilters}
                />
            </div>

            <div className="container-custom py-6">
                {/* Results Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="page-title">
                            {loading ? 'Loading...' : `${totalCount.toLocaleString()} Properties for Sale`}
                        </h1>
                        {!loading && (
                            <p className="page-subtitle">
                                Showing {properties.length} of {totalCount.toLocaleString()} results
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Map View Toggle */}
                        <div className="map-toggle hidden md:flex">
                            <span className="text-sm text-gray-600 mr-2">Map View</span>
                            <button
                                onClick={() => setMapView(!mapView)}
                                className={`toggle-switch ${mapView ? 'active' : ''}`}
                            >
                                <span className="toggle-switch-thumb" />
                            </button>
                        </div>

                        {/* View Toggle */}
                        <div className="view-toggle">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
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
                                    key={agent.agent_id}
                                    href={`/agents/${agent.agent_id}`}
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
                                    href={`/agents/${matchedAgents[0].agent_id}`}
                                    className="text-rose-500 text-sm font-medium hover:text-rose-600"
                                >
                                    View Agent Profile →
                                </Link>
                            )}
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                            {agentProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
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
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                            {sortedProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>

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
                    <ListSkeleton count={12} type="property" />
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
                }}
                filterOptions={filterOptions}
            />

            <Footer />
        </div>
    )
}
