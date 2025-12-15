'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import Pagination from '@/components/Pagination'
import { getPropertiesPaginated, getFilterOptions } from '@/lib/database'
import { Property } from '@/lib/supabase'
import { mockProperties } from '@/lib/mockData'

const PROPERTIES_PER_PAGE = 12

interface FilterOptions {
    propertyTypes: string[]
    locations: string[]
    bedrooms: number[]
    priceRange: { min: number; max: number }
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
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
    })
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        propertyTypes: [],
        locations: [],
        bedrooms: [],
        priceRange: { min: 0, max: 10000000 }
    })
    const [loadingFilters, setLoadingFilters] = useState(true)
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

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

    const loadProperties = useCallback(async (page: number, resetList: boolean = false) => {
        try {
            if (page === 1 || resetList) {
                setLoading(true)
            } else {
                setLoadingMore(true)
            }

            const result = await getPropertiesPaginated(page, PROPERTIES_PER_PAGE, {
                location: filters.location || undefined,
                propertyType: filters.propertyType || undefined,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
            })

            if (result.totalCount > 0) {
                setProperties(result.properties)
                setTotalCount(result.totalCount)
                setHasMore(result.hasMore)
                setCurrentPage(page)
            } else if (page === 1) {
                // Fallback to mock data if no properties in database
                setProperties(mockProperties)
                setTotalCount(mockProperties.length)
                setHasMore(false)
            }
        } catch (error) {
            console.error('Error loading properties:', error)
            if (page === 1) {
                setProperties(mockProperties)
                setTotalCount(mockProperties.length)
                setHasMore(false)
            }
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [filters])

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

    // Initial load
    useEffect(() => {
        loadProperties(1, true)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Reload when filters change
    const handleApplyFilters = () => {
        setCurrentPage(1)
        loadProperties(1, true)
        setShowFilters(false)
    }

    const handleResetFilters = () => {
        setFilters({ propertyType: '', minPrice: '', maxPrice: '', bedrooms: '', location: '' })
        setCurrentPage(1)
        // Need to load after state updates
        setTimeout(() => loadProperties(1, true), 0)
    }

    const handlePageChange = (page: number) => {
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
            <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
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
                    <div ref={dropdownRef} className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {/* Filters Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
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
                                                setFilters({ ...filters, propertyType: type.value })
                                                setOpenDropdown(null)
                                                loadProperties(1, true)
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
                                                setFilters({ ...filters, minPrice: range.min, maxPrice: range.max })
                                                setOpenDropdown(null)
                                                loadProperties(1, true)
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
                                                setFilters({ ...filters, bedrooms: opt.value })
                                                setOpenDropdown(null)
                                                loadProperties(1, true)
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
                                <option value="newest">Recommended</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                            <svg className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Properties Grid */}
                {loading ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-96 animate-pulse">
                                <div className="h-56 bg-gray-200 rounded-t-xl"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : sortedProperties.length > 0 ? (
                    <>
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
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl">
                        <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h3 className="font-heading font-semibold text-xl text-gray-900 mb-2">No properties found</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            We couldn&apos;t find any properties matching your criteria. Try adjusting your filters or search for a different location.
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

            <Footer />
        </div>
    )
}
