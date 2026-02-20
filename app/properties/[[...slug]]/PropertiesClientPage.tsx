'use client'



import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react'
import { useSearchParams, useRouter, useParams } from 'next/navigation'
import nextDynamic from 'next/dynamic'
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
import PageBanner from '@/components/PageBanner'
import { Metadata } from 'next'

// Dynamic imports for map components - only loaded when map view is active
const PropertyMap = nextDynamic(
    () => import('@/components/PropertyMap').then(mod => mod.default),
    {
        ssr: false,
        loading: () => (
            <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span className="text-gray-500 text-sm">Loading map...</span>
                </div>
            </div>
        )
    }
)

const MapPropertyCard = nextDynamic(
    () => import('@/components/MapPropertyCard'),
    { ssr: false }
)

// Type import for MapBounds (doesn't affect bundle)
import type { MapBounds } from '@/components/PropertyMap'
import { getPropertiesPaginated, getDistinctStates, getFilterOptions, searchAgents, getPropertiesByAgentIds, getPropertyById, getDistinctPropertyTypesByListingType } from '@/app/actions/property-actions'
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
export default function PropertiesClientPage() {
    return (
        <Suspense fallback={<PropertiesPageLoading />}>
            <PropertiesPageContent />
        </Suspense>
    )
}

function PropertiesPageContent() {
    // URL Search Params & Routing
    const searchParams = useSearchParams()
    const router = useRouter()
    const params = useParams()

    // Slug parsing logic will go here
    const slug = params?.slug as string[] | undefined

    // View Mode Initialization from URL
    const initialViewMode = (searchParams.get('view') as 'grid' | 'list') || 'grid'
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)

    // Auth
    const { user } = useAuth()

    // State
    const [properties, setProperties] = useState<Property[]>([])
    const [matchedAgents, setMatchedAgents] = useState<Agent[]>([])
    const [agentProperties, setAgentProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const initialPage = parseInt(searchParams.get('page') || '1', 10)
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [totalCount, setTotalCount] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [sortBy, setSortBy] = useState('newest')
    // const [activeTab, setActiveTab] = useState('all') // Commented out in original
    const [showFilters, setShowFilters] = useState(false)
    const [mapView, setMapView] = useState(false)
    const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [visibleMapPropertyIds, setVisibleMapPropertyIds] = useState<string[] | null>(null)

    // Filters
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        location: '',
        state: '',
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
    const lastScrollY = useRef(0)
    const scrollCooldown = useRef(0)

    // Auto-collapse/expand filter bar on scroll (mobile only)
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerWidth >= 768) return  // desktop always visible
            const currentY = window.scrollY

            // Only show when scrolled to the very top
            if (currentY > 80) {
                setMobileSearchExpanded(false)
            } else if (currentY <= 60) {
                setMobileSearchExpanded(true)
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Handler for map bounds changes
    const handleMapBoundsChange = useCallback((bounds: MapBounds, visibleIds: string[]) => {
        setVisibleMapPropertyIds(visibleIds)
    }, [])

    const handlePropertySelect = useCallback(async (id: string) => {
        const property = await getPropertyById(id)
        if (property) {
            router.push(generatePropertyUrl(property))
        } else {
            router.push(`/properties/${id}`)
        }
    }, [router])

    const loadProperties = useCallback(async (page: number, resetList: boolean = false, overrideFilters?: typeof filters) => {
        const activeFilters = overrideFilters || filters

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
                listingType: 'sale',
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

    // Initialize from Slug and SearchParams
    useEffect(() => {
        let typeFromSlug = ''
        let stateFromSlug = ''

        if (slug && slug.length > 0) {
            const firstPart = slug[0].toLowerCase()

            // Improved Heuristic Mapping
            // Logic: Check if segment is a State. If yes, it's state. If no, assume Type.

            const standardStates = [
                'johor', 'kedah', 'kelantan', 'kuala-lumpur', 'labuan', 'melaka',
                'negeri-sembilan', 'pahang', 'penang', 'perak', 'perlis',
                'putrajaya', 'sabah', 'sarawak', 'selangor', 'terengganu'
            ]

            const isState = standardStates.includes(firstPart)

            if (isState) {
                // /properties/[state]
                stateFromSlug = firstPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            } else if (firstPart === 'all-residential') {
                // /properties/all-residential/[state]
                typeFromSlug = ''
                if (slug.length > 1) {
                    stateFromSlug = slug[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }
            } else {
                // /properties/[type]
                // Assume first part is type 
                // We attempt to reconstruct the type string from the slug
                // Slugs are hyphenated: 2-storey-terraced-house -> 2 Storey Terraced House
                // But DB might assume 2-Storey (hyphenated)

                const parts = firstPart.split('-')

                typeFromSlug = parts.map((part, index) => {
                    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

                    // Handle "storey" - usually attached to previous number with hyphen
                    if (part.toLowerCase() === 'storey' && index > 0) {
                        const prev = parts[index - 1]
                        // If previous part is a number (integer or float), we might want to attach with hyphen
                        // But since we are mapping, we can't easily change the join character for just this one.
                        // Instead, we rely on fuzzy matching below, OR we produce the most likely variants.
                        return 'Storey'
                    }
                    return capitalize(part)
                }).join(' ')

                // Refinements
                // Fix "N Storey" -> "N-Storey" if that's the convention
                typeFromSlug = typeFromSlug.replace(/(\d+(\.\d+)?) Storey/gi, '$1-Storey')

                // Fix Semi-D
                if (typeFromSlug.includes('Semi D')) typeFromSlug = typeFromSlug.replace('Semi D', 'Semi-D')

                // Match against loaded filter options if available for better precision
                if (filterOptions.propertyTypes.length > 0) {
                    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
                    const target = normalize(typeFromSlug)

                    const bestMatch = filterOptions.propertyTypes.find(opt => normalize(opt) === target)
                    if (bestMatch) {
                        typeFromSlug = bestMatch
                    }
                }

                if (slug.length > 1) {
                    stateFromSlug = slug[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }
            }
        }

        // Query params still override/augment if present (e.g. for price, beds)
        const locationParam = searchParams.get('location')
        const searchParam = searchParams.get('search')
        const priceParam = searchParams.get('price')
        const bedroomsParam = searchParams.get('bedrooms')

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

        const bedroomValue = bedroomsParam ? bedroomsParam.replace('+', '') : ''

        setFilters(prev => ({
            ...prev,
            propertyType: typeFromSlug, // URL path takes precedence for type/state structure
            state: stateFromSlug,
            location: locationParam || searchParam || '',
            minPrice: minPrice,
            maxPrice: maxPrice,
            bedrooms: bedroomValue,
        }))

        // Trigger initial load
        if (!initialLoadDone.current) {
            // We need to pass these values directly because state updates are async
            loadProperties(1, true, {
                propertyType: typeFromSlug,
                state: stateFromSlug,
                location: locationParam || searchParam || '',
                minPrice: minPrice,
                maxPrice: maxPrice,
                bedrooms: bedroomValue,
                // defaults
            })
            initialLoadDone.current = true
        }

        // Handle agent search if needed
        if ((searchParam || locationParam) && (searchParam || locationParam)!.trim().length >= 2) {
            searchAgents((searchParam || locationParam)!).then(async (agents) => {
                setMatchedAgents(agents)
                if (agents.length > 0) {
                    const agentIds = agents.map(a => a.id || a.agent_id).filter((id): id is string => !!id)
                    const props = await getPropertiesByAgentIds(agentIds, 12)
                    setAgentProperties(props)
                } else {
                    setAgentProperties([])
                }
            })
        }

    }, [slug, searchParams, filterOptions]) // eslint-disable-line react-hooks/exhaustive-deps 

    // Handle view mode change
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', mode)
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Load static filter options
    useEffect(() => {
        async function loadStaticFilterOptions() {
            try {
                const [options, states] = await Promise.all([
                    getFilterOptions(),
                    getDistinctStates()
                ])

                // Initialize static parts
                setFilterOptions(prev => ({
                    ...prev,
                    ...options,
                    // Keep existing property types or let the dynamic effect handle it
                }))
                setStateOptions(states)
            } catch (error) {
                console.error('Error loading static filter options:', error)
            } finally {
                setLoadingFilters(false)
            }
        }
        loadStaticFilterOptions()
    }, [])

    // Update property types when state changes
    useEffect(() => {
        async function updatePropertyTypes() {
            try {
                const saleTypes = await getDistinctPropertyTypesByListingType('sale', filters.state)
                setFilterOptions(prev => ({
                    ...prev,
                    propertyTypes: saleTypes.sort()
                }))
            } catch (error) {
                console.error('Error updating property types:', error)
            }
        }
        updatePropertyTypes()
    }, [filters.state])

    // Close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Sync filters to URL (New clean URL logic)
    const syncFiltersToUrl = useCallback((filterState: typeof filters) => {
        // Construct path segments - ALWAYS start fresh
        let path = '/properties'

        // Clean up filter values
        const typeSlug = filterState.propertyType
            ? filterState.propertyType.trim().toLowerCase().replace(/ /g, '-')
            : null

        const stateSlug = filterState.state
            ? filterState.state.trim().toLowerCase().replace(/ /g, '-')
            : null

        // Logic: 
        // 1. /properties/[type]
        // 2. /properties/[type]/[state]
        // 3. /properties/[state] (ambiguous, usually handled as type if matches type list, else state)
        // 4. /properties/all-residential/[state] (explicit state with no type)

        if (typeSlug) {
            path += `/${typeSlug}`
            if (stateSlug) path += `/${stateSlug}`
        } else if (stateSlug) {
            // If only state is present, we use 'all-residential' prefix to be safe and explicit
            // This prevents "selangor" from being mistaken as a property type if we had a type named that
            // And it ensures the slug parser sees 2 segments: [all-residential, selangor] -> identifying state correctly.
            path += `/all-residential/${stateSlug}`
        }

        // Query params for the rest
        const params = new URLSearchParams()

        // Only add params if they have values
        if (filterState.location && filterState.location.trim()) params.set('search', filterState.location.trim())

        if (filterState.minPrice && filterState.maxPrice) {
            params.set('price', `${filterState.minPrice}-${filterState.maxPrice}`)
        } else if (filterState.minPrice) {
            params.set('price', `${filterState.minPrice}+`)
        } else if (filterState.maxPrice) {
            params.set('price', `0-${filterState.maxPrice}`)
        }

        if (filterState.bedrooms) params.set('bedrooms', filterState.bedrooms)

        // Keep view mode
        const currentView = searchParams.get('view')
        if (currentView) params.set('view', currentView)

        const queryString = params.toString()
        const finalUrl = `${path}${queryString ? `?${queryString}` : ''}`

        // Prevent redundant pushes
        if (window.location.pathname + window.location.search !== finalUrl) {
            router.replace(finalUrl, { scroll: false })
        }
    }, [router, searchParams])

    const handleApplyFilters = (overrideFilters?: typeof filters) => {
        const activeFilters = overrideFilters || filters
        setCurrentPage(1)
        loadProperties(1, true, activeFilters)
        setShowFilters(false)
        syncFiltersToUrl(activeFilters)

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
        router.replace('/properties', { scroll: false })
        loadProperties(1, true, resetFilters)
    }

    const handlePageChange = (page: number) => {
        const url = new URL(window.location.href)
        if (page > 1) {
            url.searchParams.set('page', page.toString())
        } else {
            url.searchParams.delete('page')
        }
        router.push(url.pathname + url.search, { scroll: false })
        loadProperties(page, true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleSaveSearch = () => {
        if (!user) {
            router.push('/login?message=' + encodeURIComponent('Please login to save your search.'))
            return
        }
        alert('Search saved!')
    }

    const totalPages = Math.ceil(totalCount / PROPERTIES_PER_PAGE)

    const agentPropertyIds = useMemo(() => new Set(agentProperties.map(p => p.id)), [agentProperties])

    const sortedProperties = useMemo(() => {
        return [...properties]
            .filter(p => !agentPropertyIds.has(p.id))
            .sort((a, b) => {
                if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0)
                if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0)
                return new Date(b.created_at || b.scraped_at || 0).getTime() - new Date(a.created_at || a.scraped_at || 0).getTime()
            })
    }, [properties, agentPropertyIds, sortBy])

    const propertyTypeOptions = [
        { label: 'All Residential', value: '' },
        ...filterOptions.propertyTypes.map(type => ({ label: type, value: type }))
    ]

    const bedroomOptions = [
        { label: 'Any', value: '' },
        ...filterOptions.bedrooms.map(bed => ({ label: String(bed), value: String(bed) }))
    ]

    const activeFilterCount = [
        filters.propertyType,
        filters.minPrice || filters.maxPrice,
        filters.bedrooms,
        filters.location,
        filters.state
    ].filter(Boolean).length

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <PageBanner
                title={filters.state ? `Properties For Sale in ${filters.state}` : "Buy Premium Properties in Malaysia"}
                subtitle="Discover your dream home from our extensive collection of premium properties"
                backgroundImage="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=2000&q=80"
            />

            {/* Search Filters Bar */}
            <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
                {/* Animated wrapper — max-height transition for smooth slide */}
                <div
                    className="container-custom py-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                    style={typeof window !== 'undefined' && window.innerWidth >= 768
                        ? { maxHeight: 'none', opacity: 1 }
                        : {
                            maxHeight: mobileSearchExpanded ? '400px' : '0px',
                            opacity: mobileSearchExpanded ? 1 : 0,
                        }
                    }
                >
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
                            <span>Search</span>
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
                                    <button
                                        onClick={() => {
                                            const newFilters = { ...filters, propertyType: '' }
                                            setFilters(newFilters)
                                            setOpenDropdown(null)
                                            loadProperties(1, true, newFilters)
                                            syncFiltersToUrl(newFilters)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.propertyType ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        All Residential
                                    </button>
                                    {(filterOptions?.propertyTypes || []).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                const newFilters = { ...filters, propertyType: type }
                                                setFilters(newFilters)
                                                setOpenDropdown(null)
                                                loadProperties(1, true, newFilters)
                                                syncFiltersToUrl(newFilters)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.propertyType === type ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {type}
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
                                <span>
                                    {filters.minPrice || filters.maxPrice
                                        ? `RM ${filters.minPrice ? parseInt(filters.minPrice) / 1000 + 'k' : '0'} - ${filters.maxPrice ? parseInt(filters.maxPrice) / 1000 + 'k' : 'Any'}`
                                        : 'Price'}
                                </span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'price' && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
                                    <div className="flex gap-2 items-center mb-4">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            value={filters.minPrice}
                                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                        />
                                        <span className="text-gray-400">-</span>
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            className="w-full border rounded px-2 py-1 text-sm"
                                            value={filters.maxPrice}
                                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <button onClick={() => {
                                            const newFilters = { ...filters, minPrice: '', maxPrice: '' }
                                            setFilters(newFilters)
                                            loadProperties(1, true, newFilters)
                                            syncFiltersToUrl(newFilters)
                                        }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
                                        <button onClick={() => {
                                            setOpenDropdown(null)
                                            loadProperties(1, true, filters)
                                            syncFiltersToUrl(filters)
                                        }} className="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Apply</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bedroom Pill */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenDropdown(openDropdown === 'bedrooms' ? null : 'bedrooms')}
                                className={`filter-pill ${filters.bedrooms ? 'active' : ''}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>{filters.bedrooms ? `${filters.bedrooms} Beds` : 'Bedroom'}</span>
                                <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'bedrooms' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {openDropdown === 'bedrooms' && (
                                <div className="absolute top-full left-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                    <button
                                        onClick={() => {
                                            const newFilters = { ...filters, bedrooms: '' }
                                            setFilters(newFilters)
                                            setOpenDropdown(null)
                                            loadProperties(1, true, newFilters)
                                            syncFiltersToUrl(newFilters)
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.bedrooms ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                    >
                                        Any
                                    </button>
                                    {['Studio', '1', '2', '3', '4', '5+'].map(bed => (
                                        <button
                                            key={bed}
                                            onClick={() => {
                                                const val = bed === 'Studio' ? '0' : bed.replace('+', '')
                                                const newFilters = { ...filters, bedrooms: val }
                                                setFilters(newFilters)
                                                setOpenDropdown(null)
                                                loadProperties(1, true, newFilters)
                                                syncFiltersToUrl(newFilters)
                                            }}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.bedrooms === (bed === 'Studio' ? '0' : bed.replace('+', '')) ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            {bed === 'Studio' ? 'Studio' : `${bed} Bedroom${bed !== '1' ? 's' : ''}`}
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
                    </div>


                    {
                        activeFilterCount > 0 && (
                            <button onClick={handleResetFilters} className="text-sm text-primary-600 font-medium">Clear all</button>
                        )
                    }
                </div>
            </div>

            <div className="container-custom py-6">

                {/* Filter Summary & Controls */}
                {!loading && (
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            {/* Filter Summary Pill */}
                            {(filters.propertyType || filters.minPrice || filters.maxPrice || filters.bedrooms || filters.location || filters.state) && (
                                <div className="mt-1 sm:mt-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary-50 border-l-3 sm:border-l-4 border-primary-500 rounded-r-md sm:rounded-r-lg inline-block">
                                    <p className="text-gray-700 text-sm sm:text-base font-medium leading-snug">
                                        {(() => {
                                            const summaryParts = []
                                            if (filters.propertyType) summaryParts.push(filters.propertyType)
                                            if (filters.minPrice && filters.maxPrice) {
                                                const minK = parseInt(filters.minPrice) >= 1000000 ? `RM ${(parseInt(filters.minPrice) / 1000000).toFixed(1)}M` : `RM ${(parseInt(filters.minPrice) / 1000).toFixed(0)}K`
                                                const maxK = parseInt(filters.maxPrice) >= 1000000 ? `RM ${(parseInt(filters.maxPrice) / 1000000).toFixed(1)}M` : `RM ${(parseInt(filters.maxPrice) / 1000).toFixed(0)}K`
                                                summaryParts.push(`Between ${minK} and ${maxK}`)
                                            } else if (filters.minPrice) {
                                                const minK = parseInt(filters.minPrice) >= 1000000 ? `RM ${(parseInt(filters.minPrice) / 1000000).toFixed(1)}M` : `RM ${(parseInt(filters.minPrice) / 1000).toFixed(0)}K`
                                                summaryParts.push(`Above ${minK}`)
                                            } else if (filters.maxPrice) {
                                                const maxK = parseInt(filters.maxPrice) >= 1000000 ? `RM ${(parseInt(filters.maxPrice) / 1000000).toFixed(1)}M` : `RM ${(parseInt(filters.maxPrice) / 1000).toFixed(0)}K`
                                                summaryParts.push(`Under ${maxK}`)
                                            }
                                            if (filters.bedrooms) summaryParts.push(`${filters.bedrooms}+ Bedrooms`)
                                            if (filters.location) summaryParts.push(`in ${filters.location}`)
                                            else if (filters.state) summaryParts.push(`in ${filters.state}`)
                                            return summaryParts.length > 0 ? summaryParts.join(' • ') : ''
                                        })()}
                                    </p>
                                </div>
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
                                        if (!newMapView) setVisibleMapPropertyIds(null)
                                    }}
                                    className={`toggle-switch ${mapView ? 'active' : ''}`}
                                >
                                    <span className="toggle-switch-thumb" />
                                </button>
                            </div>

                            {/* View Toggle */}
                            <div className="view-toggle">
                                <button onClick={() => handleViewModeChange('grid')} className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                </button>
                                <button onClick={() => handleViewModeChange('list')} className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-dropdown appearance-none pr-8">
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                                <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                )}

                {/* Matched Agents Section */}
                {matchedAgents.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Matching Agents ({matchedAgents.length})</h2>
                            <Link href="/agents" className="text-rose-500 text-sm font-medium hover:text-rose-600">View All Agents →</Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            {matchedAgents.map((agent) => (
                                <Link key={agent.id || agent.agent_id} href={`/agents/${agent.id || agent.agent_id}`} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-rose-300 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        {agent.photo_url ? (
                                            <img src={agent.photo_url} alt={agent.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-rose-200" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold ring-2 ring-gray-100 group-hover:ring-rose-200">{agent.name.charAt(0)}</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 truncate group-hover:text-rose-600">{agent.name}</h3>
                                            {agent.agency && <p className="text-xs text-gray-500 truncate">{agent.agency}</p>}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Agent Properties Section */}
                {!loading && agentProperties.length > 0 && matchedAgents.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Properties by {matchedAgents.length === 1 ? matchedAgents[0].name : 'Matching Agents'} ({agentProperties.length})</h2>
                            {matchedAgents.length === 1 && (
                                <Link href={`/agents/${matchedAgents[0].id || matchedAgents[0].agent_id}`} className="text-rose-500 text-sm font-medium hover:text-rose-600">View Agent Profile →</Link>
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
                                <h2 className="text-xl font-semibold text-gray-900">Other Properties Matching Your Search ({sortedProperties.length})</h2>
                            </div>
                        )}

                        {/* Map View - Premium Split Screen Layout */}
                        {mapView ? (
                            <div className="map-view-container rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                                {/* Sidebar - Property List */}
                                <div className={`map-sidebar transition-all duration-300 ${sidebarCollapsed ? 'w-0 min-w-0 opacity-0 overflow-hidden' : ''}`}>
                                    <div className="map-sidebar-header">
                                        <span className="map-sidebar-title">
                                            {visibleMapPropertyIds !== null ? `${visibleMapPropertyIds.length} of ${sortedProperties.length} Properties` : `${sortedProperties.length} Properties`}
                                        </span>
                                        <button onClick={() => setSidebarCollapsed(true)} className="p-1 hover:bg-gray-100 rounded transition-colors" aria-label="Collapse sidebar">
                                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                                        </button>
                                    </div>
                                    <div className="map-sidebar-list">
                                        <div className="map-sidebar-content">
                                            {(visibleMapPropertyIds !== null ? sortedProperties.filter(p => visibleMapPropertyIds.includes(p.id)) : sortedProperties).map((property) => (
                                                <MapPropertyCard
                                                    key={property.id}
                                                    property={property}
                                                    isHovered={hoveredPropertyId === property.id}
                                                    onHover={setHoveredPropertyId}
                                                    onClick={(id) => handlePropertySelect(id)}
                                                />
                                            ))}
                                            {visibleMapPropertyIds !== null && visibleMapPropertyIds.length === 0 && (
                                                <div className="p-4 text-center text-gray-500 text-sm">No properties in this area. Try zooming out or panning the map.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Main Map Area */}
                                <div className="map-main">
                                    {sidebarCollapsed && (
                                        <button onClick={() => setSidebarCollapsed(false)} className="map-collapse-btn" aria-label="Expand sidebar">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
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
                            {filters.location ? "We couldn't find any properties or agents matching your search. Try a different name or location." : "We couldn't find any properties matching your criteria. Try adjusting your filters."}
                        </p>
                        <button onClick={handleResetFilters} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-medium transition-colors">
                            Reset All Filters
                        </button>
                    </div>
                )}


                {totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                )}
            </div>

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
        </div >
    )
}

