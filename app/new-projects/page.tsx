'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProjectCard from '@/components/ProjectCard'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'
import FilterChips from '@/components/FilterChips'
import FilterModal from '@/components/FilterModal'
import { Property } from '@/lib/supabase'
import { getPropertiesPaginated, getDistinctStates, getFilterOptions } from '@/app/actions/property-actions'
import { ListSkeleton } from '@/components/SkeletonLoader'

const ITEMS_PER_PAGE = 12

export default function NewProjectsPage() {
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
            <NewProjectsContent />
        </Suspense>
    )
}

function NewProjectsContent() {
    const [projects, setProjects] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [stateOptions, setStateOptions] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        state: '',
        tenure: '',
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

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filters, searchQuery])

    // Load projects
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                // Fetch paginated projects
                const { properties: projectsData, totalCount: count } = await getPropertiesPaginated(
                    currentPage,
                    ITEMS_PER_PAGE,
                    {
                        location: searchQuery,
                        propertyType: filters.propertyType,
                        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
                        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
                        bedrooms: filters.bedrooms ? parseInt(filters.bedrooms) : undefined,
                        state: filters.state,
                        tenure: filters.tenure,
                        listingType: 'project'
                    },
                    true  // Enable priority state sorting for projects
                )

                setProjects(projectsData)
                setTotalCount(count)

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
                console.error('Error loading projects:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()

        // Scroll to top when page changes (but not on initial mount)
        if (currentPage > 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, filters, searchQuery])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const propertyTypes = filterOptions?.propertyTypes || []
    const tenureOptions = ['Freehold', 'Leasehold']
    const bedroomOptions = ['Studio', '1', '2', '3', '4', '5+']

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
        setOpenDropdown(null)
    }

    const resetFilters = () => {
        setFilters({
            propertyType: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            state: '',
            tenure: '',
        })
        setSearchQuery('')
    }

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                {/* Sticky Filter Bar - Matching Buy/Rent pages */}
                <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
                    <div className="container-custom py-4">
                        {/* Search Input + Save Search */}
                        <div className="flex gap-4 mb-4">
                            <SearchInput
                                value={searchQuery}
                                onChange={(val) => setSearchQuery(val)}
                                onSearch={(val) => setSearchQuery(val)}
                                placeholder="Search new projects by name or location..."
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
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                    className={`filter-pill ${filters.propertyType ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{filters.propertyType || 'Property Type'}</span>
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
                                            All Types
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

                            {/* Price Pill with Min/Max Picker */}
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
                                                                    name="minPriceNewProjects"
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
                                                                    name="maxPriceNewProjects"
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

                            {/* Bedroom Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'beds' ? null : 'beds')}
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
                                    Clear all
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
                                    label: 'Price',
                                    value: filters.minPrice && filters.maxPrice
                                        ? `RM${(parseInt(filters.minPrice) / 1000)}k - RM${(parseInt(filters.maxPrice) / 1000)}k`
                                        : filters.minPrice
                                            ? `Above RM${(parseInt(filters.minPrice) / 1000)}k`
                                            : `Under RM${(parseInt(filters.maxPrice) / 1000)}k`
                                } : null,
                                filters.bedrooms ? { key: 'bedrooms', label: 'Bedrooms', value: `${filters.bedrooms}` } : null,
                                filters.tenure ? { key: 'tenure', label: 'Tenure', value: filters.tenure } : null,
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
                            <h1 className="page-title">{loading ? 'Loading...' : `${totalCount} New Projects`}</h1>
                            <p className="page-subtitle">
                                {!loading && `Showing ${projects.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - ${(currentPage - 1) * ITEMS_PER_PAGE + projects.length} of ${totalCount} results`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <ListSkeleton count={8} type="property" />
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            {/* Coming Soon Icon */}
                            <div className="mb-6 p-6 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full">
                                <svg className="w-16 h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>

                            {/* Title */}
                            <h3 className="font-heading font-bold text-3xl text-gray-900 mb-3 text-center">
                                {activeFilterCount > 0 ? 'No Projects Found' : 'Coming Soon'}
                            </h3>

                            {/* Description */}
                            <p className="text-gray-600 text-center max-w-md mb-6">
                                {activeFilterCount > 0
                                    ? "Try adjusting your filters to see more projects."
                                    : "We're working on bringing you the latest new property launches in Malaysia. This feature will be available soon!"}
                            </p>

                            {activeFilterCount > 0 ? (
                                <button
                                    onClick={resetFilters}
                                    className="btn-primary"
                                >
                                    Clear All Filters
                                </button>
                            ) : (
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Under Development
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map(project => (
                                    <ProjectCard key={project.id} property={project} />
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
                        propertyType: 'Property Type',
                        price: 'Price',
                        bedroom: 'Bedroom',
                        state: 'State'
                    }}
                />
            )}

            <Footer />
        </>
    )
}
