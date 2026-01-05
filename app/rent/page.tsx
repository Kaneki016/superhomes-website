'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import Pagination from '@/components/Pagination'
import { Property } from '@/lib/supabase'
import { getRentListings, getDistinctStates } from '@/lib/database'

const ITEMS_PER_PAGE = 12

export default function RentPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [stateOptions, setStateOptions] = useState<string[]>([])
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        state: '',
        furnishing: '',
    })
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    // Pagination calculations
    const totalPages = Math.ceil(properties.length / ITEMS_PER_PAGE)
    const paginatedProperties = properties.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filters])

    // Load rent listings
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const rentData = await getRentListings(filters)
                setProperties(rentData)

                const states = await getDistinctStates()
                setStateOptions(states)
            } catch (error) {
                console.error('Error loading rent listings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(filters)])

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

    const propertyTypes = ['Condominium', 'Service Residence', 'Apartment', 'Terraced House', 'Semi-D', 'Bungalow', 'Studio', 'Flat']
    const furnishingOptions = ['Fully Furnished', 'Partially Furnished', 'Unfurnished']
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
            furnishing: '',
        })
    }

    const activeFilterCount = Object.values(filters).filter(v => v !== '').length

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                {/* Hero Section */}
                <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white py-16">
                    <div className="container-custom">
                        <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">
                            Properties for Rent
                        </h1>
                        <p className="text-xl text-white/80 mb-8">
                            Find your perfect rental home in Malaysia
                        </p>

                        {/* Search Box */}
                        <div className="max-w-2xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by location or property name..."
                                    className="w-full px-5 py-4 pr-12 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-300"
                                />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section className="sticky top-[72px] bg-white border-b border-gray-200 z-30 py-4">
                    <div className="container-custom">
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Property Type */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'type' ? null : 'type')
                                    }}
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
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
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

                            {/* Price */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'price' ? null : 'price')
                                    }}
                                    className={`filter-pill ${filters.minPrice || filters.maxPrice ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{filters.minPrice || filters.maxPrice ? 'Price Set' : 'Monthly Rent'}</span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'price' && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <button
                                            onClick={() => handlePriceRangeSelect('', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.minPrice && !filters.maxPrice ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            Any Price
                                        </button>
                                        {priceRanges.map((range, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handlePriceRangeSelect(range.min, range.max)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                                            >
                                                {range.label}
                                            </button>
                                        ))}
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

                            {/* Furnishing */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'furnishing' ? null : 'furnishing')
                                    }}
                                    className={`filter-pill ${filters.furnishing ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <span>{filters.furnishing || 'Furnishing'}</span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'furnishing' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'furnishing' && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <button
                                            onClick={() => handleFilterChange('furnishing', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.furnishing ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            Any Furnishing
                                        </button>
                                        {furnishingOptions.map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => handleFilterChange('furnishing', opt)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.furnishing === opt ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                            >
                                                {opt}
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
                </section>

                {/* Properties Grid */}
                <section className="py-8">
                    <div className="container-custom">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-heading font-bold text-gray-900">
                                {loading ? 'Loading...' : `${properties.length} Properties for Rent`}
                            </h2>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                                        <div className="aspect-[4/3] bg-gray-200" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-5 bg-gray-200 rounded w-3/4" />
                                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                                            <div className="h-6 bg-gray-200 rounded w-2/3" />
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {paginatedProperties.map(property => (
                                        <PropertyCard key={property.id} property={property} />
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
                </section>
            </main>
            <Footer />
        </>
    )
}
