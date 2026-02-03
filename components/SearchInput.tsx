'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { generatePropertySlug, generatePropertyUrl } from '@/lib/slugUtils'

// Property suggestion type from API
interface PropertySuggestion {
    id: string
    property_name: string
    address: string
    state: string | null
    property_type: string
    price: number
}

// Malaysian locations data for typeahead
const MALAYSIAN_LOCATIONS = [
    // States
    'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Kedah', 'Kelantan',
    'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Putrajaya',
    'Sabah', 'Sarawak', 'Terengganu',
    // Popular areas in Kuala Lumpur
    'Mont Kiara', 'Bangsar', 'KLCC', 'Bukit Bintang', 'Cheras', 'Kepong',
    'Damansara', 'Sri Hartamas', 'Desa ParkCity', 'Taman Tun Dr Ismail',
    'Ampang', 'Setapak', 'Wangsa Maju', 'Segambut', 'Sentul',
    // Popular areas in Selangor
    'Petaling Jaya', 'Subang Jaya', 'Shah Alam', 'Puchong', 'Klang',
    'Cyberjaya', 'Setia Alam', 'USJ', 'Bandar Utama',
    'Kota Damansara', 'Ara Damansara', 'Tropicana', 'Sunway', 'SS2',
    'Bukit Jalil', 'Seri Kembangan', 'Kajang', 'Semenyih', 'Rawang',
    // Penang areas
    'George Town', 'Tanjung Bungah', 'Gurney', 'Bayan Lepas', 'Jelutong',
    // Johor areas
    'Johor Bahru', 'Iskandar Puteri', 'Nusajaya', 'Mount Austin', 'Tebrau',
]

const RECENT_SEARCHES_KEY = 'superhomes_recent_searches'
const MAX_RECENT_SEARCHES = 5

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    onSearch: (value: string) => void
    placeholder?: string
    className?: string
}

// Highlight matching keyword in text
function highlightMatch(text: string, keyword: string): React.ReactNode {
    if (!keyword.trim() || !text) return text

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
        regex.test(part) ? (
            <span key={i} className="text-rose-500 font-semibold">{part}</span>
        ) : part
    )
}

export default function SearchInput({
    value,
    onChange,
    onSearch,
    placeholder = 'Search by location, property name, or keyword...',
    className = '',
}: SearchInputProps) {
    const [isFocused, setIsFocused] = useState(false)
    const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
    const [propertySuggestions, setPropertySuggestions] = useState<PropertySuggestion[]>([])
    const [recentSearches, setRecentSearches] = useState<string[]>([])
    const [selectedIndex, setSelectedIndex] = useState(-1)
    const [isSearching, setIsSearching] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Load recent searches from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
            if (saved) {
                setRecentSearches(JSON.parse(saved))
            }
        } catch {
            // Ignore localStorage errors
        }
    }, [])

    // Save recent search
    const saveRecentSearch = useCallback((searchTerm: string) => {
        if (!searchTerm.trim()) return

        try {
            const trimmed = searchTerm.trim()
            const updated = [trimmed, ...recentSearches.filter(s => s !== trimmed)].slice(0, MAX_RECENT_SEARCHES)
            setRecentSearches(updated)
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
        } catch {
            // Ignore localStorage errors
        }
    }, [recentSearches])

    // Search properties and locations with debouncing
    useEffect(() => {
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        if (value.trim().length >= 2) {
            // Filter static location suggestions immediately
            const query = value.toLowerCase()
            const locationMatches = MALAYSIAN_LOCATIONS
                .filter(loc => loc.toLowerCase().includes(query))
                .slice(0, 4)
            setLocationSuggestions(locationMatches)

            // Debounce property search (300ms) - use API route
            setIsSearching(true)
            searchTimeoutRef.current = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&limit=5`)
                    if (response.ok) {
                        const properties = await response.json()
                        setPropertySuggestions(properties)
                    } else {
                        setPropertySuggestions([])
                    }
                } catch (error) {
                    console.error('Error searching properties:', error)
                    setPropertySuggestions([])
                } finally {
                    setIsSearching(false)
                }
            }, 300)
        } else {
            setLocationSuggestions([])
            setPropertySuggestions([])
            setIsSearching(false)
        }

        setSelectedIndex(-1)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [value])

    // Handle click outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsFocused(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        const totalItems = locationSuggestions.length + propertySuggestions.length +
            (value.trim() ? 0 : recentSearches.length)

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : prev))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Escape') {
            setIsFocused(false)
        }
    }

    const handleLocationSelect = (location: string) => {
        onChange(location)
        saveRecentSearch(location)
        onSearch(location)
        setIsFocused(false)
    }

    const handleSubmit = () => {
        if (value.trim()) {
            saveRecentSearch(value)
        }
        onSearch(value)
        setIsFocused(false)
    }

    const clearRecentSearches = () => {
        setRecentSearches([])
        localStorage.removeItem(RECENT_SEARCHES_KEY)
    }

    const showDropdown = isFocused && (
        locationSuggestions.length > 0 ||
        propertySuggestions.length > 0 ||
        isSearching ||
        (recentSearches.length > 0 && !value.trim())
    )

    return (
        <div className={`relative ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-12 pr-10 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                />
                {value && (
                    <button
                        onClick={() => onChange('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 max-h-[400px] overflow-y-auto"
                >
                    {/* Loading indicator */}
                    {isSearching && (
                        <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Searching properties...
                        </div>
                    )}

                    {/* Property Suggestions */}
                    {propertySuggestions.length > 0 && (
                        <div className="border-b border-gray-100">
                            {propertySuggestions.map((property) => (
                                <Link
                                    key={property.id}
                                    href={generatePropertyUrl({ ...property, title: property.property_name, listing_type: 'sale' } as any)}
                                    onClick={() => setIsFocused(false)}
                                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-900 truncate">
                                                {highlightMatch(property.property_name, value)}
                                            </div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {highlightMatch(property.address || property.state || '', value)}
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full whitespace-nowrap">
                                            {property.property_type?.slice(0, 12) || 'Property'}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Location Suggestions */}
                    {locationSuggestions.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Locations
                            </div>
                            {locationSuggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => handleLocationSelect(suggestion)}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-700"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>{highlightMatch(suggestion, value)}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Recent Searches */}
                    {!value.trim() && recentSearches.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Recent Searches
                                </span>
                                <button
                                    onClick={clearRecentSearches}
                                    className="text-xs text-rose-500 hover:text-rose-600"
                                >
                                    Clear
                                </button>
                            </div>
                            {recentSearches.map((search) => (
                                <button
                                    key={search}
                                    onClick={() => handleLocationSelect(search)}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-gray-700"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{search}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No results message */}
                    {!isSearching && value.trim().length >= 2 &&
                        propertySuggestions.length === 0 && locationSuggestions.length === 0 && (
                            <div className="px-4 py-4 text-sm text-gray-500 text-center">
                                No matching properties or locations found
                            </div>
                        )}
                </div>
            )}
        </div>
    )
}
