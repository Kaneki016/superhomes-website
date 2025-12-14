'use client'

import { useState, useEffect, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { getPropertiesPaginated } from '@/lib/database'
import { Property } from '@/lib/supabase'
import { mockProperties } from '@/lib/mockData'

const PROPERTIES_PER_PAGE = 12

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [hasMore, setHasMore] = useState(false)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [sortBy, setSortBy] = useState('newest')
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        location: '',
    })

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
                if (page === 1 || resetList) {
                    setProperties(result.properties)
                } else {
                    setProperties(prev => [...prev, ...result.properties])
                }
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

    // Initial load
    useEffect(() => {
        loadProperties(1, true)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Reload when filters change
    const handleApplyFilters = () => {
        setCurrentPage(1)
        loadProperties(1, true)
    }

    const handleResetFilters = () => {
        setFilters({ propertyType: '', minPrice: '', maxPrice: '', bedrooms: '', location: '' })
        setCurrentPage(1)
        // Need to load after state updates
        setTimeout(() => loadProperties(1, true), 0)
    }

    const handleLoadMore = () => {
        if (hasMore && !loadingMore) {
            loadProperties(currentPage + 1)
        }
    }

    // Sort properties client-side
    const sortedProperties = [...properties].sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price
        if (sortBy === 'price-high') return b.price - a.price
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-heading font-bold text-4xl text-gray-900 mb-2">Browse Properties</h1>
                    <p className="text-gray-600">
                        {loading ? 'Loading...' : `Showing ${properties.length} of ${totalCount} properties`}
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:w-80 flex-shrink-0">
                        <div className="glass p-6 rounded-2xl sticky top-24">
                            <h2 className="font-heading font-bold text-xl mb-6">Filters</h2>

                            {/* Location */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                                <input
                                    type="text"
                                    placeholder="Enter location"
                                    value={filters.location}
                                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            {/* Property Type */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                                <select
                                    value={filters.propertyType}
                                    onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">All Types</option>
                                    <option value="Condo">Condo</option>
                                    <option value="Landed">Landed</option>
                                    <option value="Apartment">Apartment</option>
                                    <option value="Commercial">Commercial</option>
                                    <option value="Terraced">Terraced House</option>
                                    <option value="Semi-D">Semi-D</option>
                                    <option value="Bungalow">Bungalow</option>
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                        className="input-field"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                        className="input-field"
                                    />
                                </div>
                            </div>

                            {/* Bedrooms */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                                <select
                                    value={filters.bedrooms}
                                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="">Any</option>
                                    <option value="1">1+</option>
                                    <option value="2">2+</option>
                                    <option value="3">3+</option>
                                    <option value="4">4+</option>
                                    <option value="5">5+</option>
                                </select>
                            </div>

                            {/* Filter Buttons */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleApplyFilters}
                                    className="btn-primary w-full"
                                >
                                    Apply Filters
                                </button>
                                <button
                                    onClick={handleResetFilters}
                                    className="btn-secondary w-full"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            {/* Sort */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="input-field w-auto"
                                >
                                    <option value="newest">Newest</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Properties Grid/List */}
                        {loading ? (
                            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className="glass rounded-2xl h-80 animate-pulse bg-gray-200"></div>
                                ))}
                            </div>
                        ) : sortedProperties.length > 0 ? (
                            <>
                                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-6'}>
                                    {sortedProperties.map((property) => (
                                        <PropertyCard key={property.id} property={property} />
                                    ))}
                                </div>

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="mt-10 text-center">
                                        <button
                                            onClick={handleLoadMore}
                                            disabled={loadingMore}
                                            className="btn-primary px-8 py-3 inline-flex items-center"
                                        >
                                            {loadingMore ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading...
                                                </>
                                            ) : (
                                                <>
                                                    Load More Properties
                                                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </>
                                            )}
                                        </button>
                                        <p className="text-gray-500 text-sm mt-3">
                                            {totalCount - properties.length} more properties to load
                                        </p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-20">
                                <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <h3 className="font-heading font-semibold text-xl text-gray-900 mb-2">No properties found</h3>
                                <p className="text-gray-600 mb-6">Try adjusting your filters to see more results</p>
                                <button
                                    onClick={handleResetFilters}
                                    className="btn-primary"
                                >
                                    Reset Filters
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </div>
    )
}
