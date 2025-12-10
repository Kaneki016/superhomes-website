'use client'

import { useState } from 'react'

interface SearchBarProps {
    onSearch?: (filters: SearchFilters) => void
}

export interface SearchFilters {
    location: string
    propertyType: string
    minPrice: string
    maxPrice: string
}

export default function SearchBar({ onSearch }: SearchBarProps) {
    const [filters, setFilters] = useState<SearchFilters>({
        location: '',
        propertyType: '',
        minPrice: '',
        maxPrice: '',
    })

    const handleSearch = () => {
        if (onSearch) {
            onSearch(filters)
        }
    }

    return (
        <div className="glass p-6 rounded-2xl shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Enter location"
                            value={filters.location}
                            onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                            className="input-field pl-10"
                        />
                    </div>
                </div>

                {/* Property Type */}
                <div>
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
                    </select>
                </div>

                {/* Price Range */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                    <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                        className="input-field"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                    <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                        className="input-field"
                    />
                </div>
            </div>

            {/* Search Button */}
            <div className="mt-6">
                <button onClick={handleSearch} className="btn-primary w-full md:w-auto px-12">
                    <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Properties
                    </div>
                </button>
            </div>
        </div>
    )
}
