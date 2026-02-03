'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'
import FilterChips from '@/components/FilterChips'
import FilterModal from '@/components/FilterModal'
import { Property } from '@/lib/types'
import { getPropertiesPaginated, getDistinctStates, getFilterOptions } from '@/app/actions/property-actions'
import { ListSkeleton } from '@/components/SkeletonLoader'
import PageBanner from '@/components/PageBanner'

const ITEMS_PER_PAGE = 12

export default function RentPageClient() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-6">
                    <ListSkeleton count={8} type="property" />
                </div>
                <Footer />
            </div>
        }>
            <RentPageContent />
        </Suspense>
    )
}

function RentPageContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // View Mode from URL
    const initialViewMode = (searchParams.get('view') as 'grid' | 'list') || 'grid'
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [stateOptions, setStateOptions] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
    const [sortBy, setSortBy] = useState('newest')
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        state: '',

    })
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [filterModalOpen, setFilterModalOpen] = useState(false)
    const [filterOptions, setFilterOptions] = useState<{
        propertyTypes: string[]
        locations: string[]
        bedrooms: number[]
        priceRange: { min: number; max: number }
    } | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Update view mode handler to persist to URL
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', mode)
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Sync state if URL changes externally
    useEffect(() => {
        const viewFromUrl = searchParams.get('view') as 'grid' | 'list'
        if (viewFromUrl && viewFromUrl !== viewMode) {
            setViewMode(viewFromUrl)
        }
    }, [searchParams, viewMode])

    // Initialize filters from URL parameters
    useEffect(() => {
        const typeParam = searchParams.get('type')
        const stateParam = searchParams.get('state')
        const priceParam = searchParams.get('price')
        const bedroomsParam = searchParams.get('bedrooms')
        const searchParam = searchParams.get('search')

        if (typeParam || stateParam || priceParam || bedroomsParam || searchParam) {
            // Parse price range (e.g., "1000-2000" or "5000+")
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

            // Handle bedroom values (e.g., "5+" becomes "5")
            const bedroomValue = bedroomsParam ? bedroomsParam.replace('+', '') : ''

            setFilters(prev => ({
                ...prev,
                propertyType: typeParam || '',
                state: stateParam || '',
                minPrice: minPrice,
                maxPrice: maxPrice,
                bedrooms: bedroomValue,
            }))

            if (searchParam) {
                setSearchQuery(searchParam)
            }
        }
    }, [searchParams])

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchQuery])

    // Load rent listings
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                // Fetch paginated properties
                const { properties: rentData, totalCount: count } = await getPropertiesPaginated(
                    currentPage,
                    ITEMS_PER_PAGE,
                    {
                        location: searchQuery,
                        propertyType: filters.propertyType,
                        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
                        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
                        bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : undefined,
                        state: filters.state,
                        listingType: 'rent'
                    }
                )

                setProperties(rentData)
                setTotalCount(count)

                // Load state options if empty
                if (stateOptions.length === 0) {
                    const states = await getDistinctStates()
                    setStateOptions(states)
                }

                // Load filter options for modal
                if (!filterOptions) {
                    const options = await getFilterOptions()
                    setFilterOptions(options)
                }
            } catch (error) {
                console.error('Error loading rent listings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters, searchQuery])

    // Initialize filters from URL params
    const initialLoadDone = useRef(false)
    useEffect(() => {
        if (initialLoadDone.current) return

        const stateParam = searchParams.get('state')
        const locationParam = searchParams.get('location')
        const searchParam = searchParams.get('search')
        const typeParam = searchParams.get('type')
        const priceParam = searchParams.get('price')
        const bedroomsParam = searchParams.get('bedrooms')

        const hasAnyParam = stateParam || locationParam || searchParam || typeParam || priceParam || bedroomsParam

        if (hasAnyParam) {
            // Parse price range
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

            // Map property type values
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

            setFilters(prev => ({
                ...prev,
                state: stateParam || '',
                propertyType: mappedPropertyType,
                minPrice: minPrice,
                maxPrice: maxPrice,
                bedrooms: bedroomsParam || '',
            }))

            if (searchParam || locationParam) {
                setSearchQuery(searchParam || locationParam || '')
            }
        }

        initialLoadDone.current = true
    }, [searchParams])

    // Sync filters to URL
    const syncFiltersToUrl = (filterState: typeof filters, search: string) => {
        if (!initialLoadDone.current) return

        const params = new URLSearchParams()
        if (filterState.state) params.set('state', filterState.state)
        if (filterState.propertyType) params.set('type', filterState.propertyType)
        if (filterState.minPrice && filterState.maxPrice) {
            params.set('price', `${filterState.minPrice}-${filterState.maxPrice}`)
        } else if (filterState.minPrice) {
            params.set('price', `${filterState.minPrice}+`)
        } else if (filterState.maxPrice) {
            params.set('price', `0-${filterState.maxPrice}`)
        }
        if (filterState.bedrooms) params.set('bedrooms', filterState.bedrooms)
        if (search) params.set('search', search)
        if (viewMode === 'list') params.set('view', 'list')

        const queryString = params.toString()
        router.replace(`/rent${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }

    // Update sync effect
    useEffect(() => {
        if (initialLoadDone.current) {
            syncFiltersToUrl(filters, searchQuery)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, searchQuery])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            const target = e.target as HTMLElement
            if (!target.closest('.filter-dropdown')) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const propertyTypes = filterOptions?.propertyTypes || []

    const bedroomOptions = ['Studio', '1', '2', '3', '4', '5+']
    const priceRanges = [
        { label: 'Under RM 1,000', min: '', max: '1000' },
        { label: 'RM 1,000 - 2,000', min: '1000', max: '2000' },
        { label: 'RM 2,000 - 3,000', min: '2000', max: '3000' },
        { label: 'RM 3,000 - 5,000', min: '3000', max: '5000' },
        { label: 'RM 5,000 - 10,000', min: '5000', max: '10000' },
        { label: 'Above RM 10,000', min: '10000', max: '' },
    ]

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
        setOpenDropdown(null)
    }

    const handlePriceRangeSelect = (min: string, max: string) => {
        setFilters(prev => ({ ...prev, minPrice: min, maxPrice: max }))
        setOpenDropdown(null)
    }

    const resetFilters = () => {
        setFilters({
            propertyType: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            state: '',

        })
    }

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                <PageBanner
                    title="Properties For Rent"
                    subtitle="Find the perfect rental property that fits your lifestyle"
                    backgroundImage="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
                />
                {/* Sticky Filter Bar */}
                <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
                    <div className="container-custom py-4">
                        {/* Search Input + Save Search */}
                        <div className="flex gap-4 mb-4">
                            <SearchInput
                                value={searchQuery}
                                onChange={(val) => setSearchQuery(val)}
                                onSearch={(val) => setSearchQuery(val)}
                                placeholder="Search location, project, or area..."
                                className="flex-1"
                            />
                            <button
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
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                    className={`filter-pill ${filters.propertyType ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{filters.propertyType || 'All Residential'}</span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'type' && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                                        <button
                                            onClick={() => handleFilterChange('propertyType', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.propertyType ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            All Residential
                                        </button>
                                        {propertyTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => handleFilterChange('propertyType', type)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.propertyType === type ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Price */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'price' || openDropdown === 'priceMin' || openDropdown === 'priceMax' ? null : 'price')
                                    }}
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
                                            : 'Monthly Rent'}
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
                                                    className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown(openDropdown === 'priceMin' ? 'price' : 'priceMin')
                                                    }}
                                                >
                                                    <span className="text-gray-500 mr-2 text-sm font-medium">RM</span>
                                                    <span className="flex-1 text-gray-700 text-sm">
                                                        {filters.minPrice ? parseInt(filters.minPrice).toLocaleString() : 'Min'}
                                                    </span>
                                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'priceMin' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                                {openDropdown === 'priceMin' && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[60] max-h-60 overflow-y-auto">
                                                        {[
                                                            { label: 'No Min', value: '' },
                                                            { label: '500', value: '500' },
                                                            { label: '1,000', value: '1000' },
                                                            { label: '1,500', value: '1500' },
                                                            { label: '2,000', value: '2000' },
                                                            { label: '2,500', value: '2500' },
                                                            { label: '3,000', value: '3000' },
                                                            { label: '4,000', value: '4000' },
                                                            { label: '5,000', value: '5000' },
                                                            { label: '7,500', value: '7500' },
                                                            { label: '10,000', value: '10000' },
                                                        ].map((opt) => (
                                                            <label
                                                                key={opt.value}
                                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="minPriceRent"
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
                                                    className="flex items-center border border-gray-300 rounded-lg px-3 py-2.5 bg-white cursor-pointer hover:border-gray-400 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setOpenDropdown(openDropdown === 'priceMax' ? 'price' : 'priceMax')
                                                    }}
                                                >
                                                    <span className="text-gray-500 mr-2 text-sm font-medium">RM</span>
                                                    <span className="flex-1 text-gray-700 text-sm">
                                                        {filters.maxPrice ? parseInt(filters.maxPrice).toLocaleString() : 'Max'}
                                                    </span>
                                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'priceMax' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                                {openDropdown === 'priceMax' && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-[60] max-h-60 overflow-y-auto">
                                                        {[
                                                            { label: 'No Max', value: '' },
                                                            { label: '1,000', value: '1000' },
                                                            { label: '1,500', value: '1500' },
                                                            { label: '2,000', value: '2000' },
                                                            { label: '2,500', value: '2500' },
                                                            { label: '3,000', value: '3000' },
                                                            { label: '4,000', value: '4000' },
                                                            { label: '5,000', value: '5000' },
                                                            { label: '7,500', value: '7500' },
                                                            { label: '10,000', value: '10000' },
                                                            { label: '15,000', value: '15000' },
                                                        ].map((opt) => (
                                                            <label
                                                                key={opt.value}
                                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="maxPriceRent"
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
                                                    setFilters({ ...filters, minPrice: '', maxPrice: '' })
                                                }}
                                                className="py-2.5 px-4 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={() => setOpenDropdown(null)}
                                                className="py-2.5 px-4 bg-primary-600 hover:bg-primary-700 rounded-full text-sm font-medium text-white transition-colors"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bedrooms */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'beds' ? null : 'beds')
                                    }}
                                    className={`filter-pill ${filters.bedrooms ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span>{filters.bedrooms ? `${filters.bedrooms} Beds` : 'Bedroom'}</span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'beds' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'beds' && (
                                    <div className="absolute top-full left-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <button
                                            onClick={() => handleFilterChange('bedrooms', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.bedrooms ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            Any
                                        </button>
                                        {bedroomOptions.map(bed => (
                                            <button
                                                key={bed}
                                                onClick={() => handleFilterChange('bedrooms', bed)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.bedrooms === bed ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                            >
                                                {bed === 'Studio' ? 'Studio' : `${bed} Bedroom${bed !== '1' ? 's' : ''}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* State */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'state' ? null : 'state')
                                    }}
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
                                            onClick={() => handleFilterChange('state', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.state ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            All States
                                        </button>
                                        {stateOptions.map(state => (
                                            <button
                                                key={state}
                                                onClick={() => handleFilterChange('state', state)}
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
                                    onClick={resetFilters}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                                >
                                    Clear all ({activeFilterCount})
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    <div className="container-custom">
                        <FilterChips
                            filters={[
                                searchQuery ? { key: 'search', label: 'Search', value: searchQuery } : null,
                                filters.state ? { key: 'state', label: 'State', value: filters.state } : null,
                                filters.propertyType ? { key: 'propertyType', label: 'Type', value: filters.propertyType } : null,
                                filters.minPrice || filters.maxPrice ? {
                                    key: 'price',
                                    label: 'Rent',
                                    value: filters.minPrice && filters.maxPrice
                                        ? `RM${parseInt(filters.minPrice).toLocaleString()} - RM${parseInt(filters.maxPrice).toLocaleString()}/mo`
                                        : filters.minPrice
                                            ? `Above RM${parseInt(filters.minPrice).toLocaleString()}/mo`
                                            : `Under RM${parseInt(filters.maxPrice).toLocaleString()}/mo`
                                } : null,
                                filters.bedrooms ? { key: 'bedrooms', label: 'Bedrooms', value: `${filters.bedrooms}` } : null,

                            ].filter(Boolean) as { key: string; label: string; value: string }[]}
                            onRemove={(key) => {
                                if (key === 'search') {
                                    setSearchQuery('')
                                } else if (key === 'price') {
                                    setFilters({ ...filters, minPrice: '', maxPrice: '' })
                                } else {
                                    setFilters({ ...filters, [key]: '' })
                                }
                            }}
                            onClearAll={resetFilters}
                        />
                    </div>
                </div>

                {/* Results Section */}
                <div className="container-custom py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="page-title">{loading ? 'Loading...' : `${totalCount} Properties for Rent`}</h1>
                            <p className="page-subtitle">
                                {!loading && `Showing ${Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of ${totalCount} results`}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
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

                    {loading ? (
                        <ListSkeleton count={8} type="property" viewMode={viewMode} />
                    ) : properties.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            {/* Empty Icon */}
                            <div className="mb-6 p-6 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full">
                                <svg className="w-16 h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h3 className="font-heading font-bold text-3xl text-gray-900 mb-3 text-center">
                                No Rental Properties Found
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 text-center max-w-md mb-6">
                                {activeFilterCount > 0
                                    ? "Try adjusting your filters to see more properties."
                                    : "There are no rental listings available at the moment. Check back soon!"}
                            </p>

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="btn-primary"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className={viewMode === 'list' ? "flex flex-col gap-4 max-w-4xl mx-auto" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
                                {properties.map(property => (
                                    <PropertyCard key={property.id} property={property} variant={viewMode} />
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Filter Modal */}
            {filterOptions && (
                <FilterModal
                    isOpen={filterModalOpen}
                    onClose={() => setFilterModalOpen(false)}
                    filters={{
                        propertyType: filters.propertyType,
                        minPrice: filters.minPrice,
                        maxPrice: filters.maxPrice,
                        bedrooms: filters.bedrooms,
                        location: searchQuery,
                        state: filters.state,

                    }}
                    onApply={(newFilters) => {
                        setFilters({
                            ...filters,
                            propertyType: newFilters.propertyType,
                            minPrice: newFilters.minPrice,
                            maxPrice: newFilters.maxPrice,
                            bedrooms: newFilters.bedrooms,
                            state: newFilters.state,

                        })
                        setSearchQuery(newFilters.location)
                        setFilterModalOpen(false)
                    }}
                    filterOptions={filterOptions}
                    stateOptions={stateOptions}
                    tabLabels={{
                        propertyType: 'All Residential',
                        price: 'Monthly Rent',
                        bedroom: 'Bedroom',
                        state: 'State'
                    }}
                />
            )}

            <Footer />
        </>
    )
}
