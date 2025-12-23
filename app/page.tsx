'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import PropertyCardSkeleton from '@/components/PropertyCardSkeleton'
import { getFeaturedProperties, getDiverseProperties } from '@/lib/database'
import { Property } from '@/lib/supabase'
// Fallback to mock data if database is empty
import { mockProperties } from '@/lib/mockData'

export default function HomePage() {
    const [featuredProperties, setFeaturedProperties] = useState<Property[]>([])
    const [handpickedProperties, setHandpickedProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    // Buy/Rent toggle removed - listing type data not available yet
    const [searchQuery, setSearchQuery] = useState('')
    const [propertyType, setPropertyType] = useState('all')
    const [priceRange, setPriceRange] = useState('')
    const [bedrooms, setBedrooms] = useState('')
    const [selectedState, setSelectedState] = useState('')
    const [showPropertyTypeDropdown, setShowPropertyTypeDropdown] = useState(false)
    const [showPriceDropdown, setShowPriceDropdown] = useState(false)
    const [showBedroomDropdown, setShowBedroomDropdown] = useState(false)
    const [showStateDropdown, setShowStateDropdown] = useState(false)
    const [handpickedIndex, setHandpickedIndex] = useState(0)

    const filterRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function loadProperties() {
            try {
                // Fetch Featured (4 newest) and Handpicked (12 from diverse agents) separately
                const [featured, diverse] = await Promise.all([
                    getFeaturedProperties(4),
                    getDiverseProperties(12)
                ])

                if (featured.length > 0) {
                    setFeaturedProperties(featured)
                } else {
                    setFeaturedProperties(mockProperties.slice(0, 4))
                }

                if (diverse.length > 0) {
                    // Filter out any properties already in featured
                    const featuredIds = new Set(featured.map(p => p.id))
                    const uniqueHandpicked = diverse.filter(p => !featuredIds.has(p.id))
                    setHandpickedProperties(uniqueHandpicked.slice(0, 12))
                } else {
                    setHandpickedProperties(mockProperties.slice(4, 12))
                }
            } catch (error) {
                console.error('Error loading properties:', error)
                setFeaturedProperties(mockProperties.slice(0, 4))
                setHandpickedProperties(mockProperties.slice(4, 12))
            } finally {
                setLoading(false)
            }
        }
        loadProperties()
    }, [])

    // Load preferred state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('superhomes_preferred_state')
        if (savedState) {
            setSelectedState(savedState)
        }
    }, [])

    // Save state selection to localStorage
    useEffect(() => {
        if (selectedState) {
            localStorage.setItem('superhomes_preferred_state', selectedState)
        } else {
            localStorage.removeItem('superhomes_preferred_state')
        }
    }, [selectedState])

    // Close dropdowns when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setShowPropertyTypeDropdown(false)
                setShowPriceDropdown(false)
                setShowBedroomDropdown(false)
                setShowStateDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Carousel configuration
    const totalSlides = Math.ceil(handpickedProperties.length / 4) // 4 properties per view

    // Navigation functions - direct slide change with CSS transition
    const goToPrevSlide = () => {
        setHandpickedIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
    }

    const goToNextSlide = () => {
        setHandpickedIndex((prev) => (prev + 1) % totalSlides)
    }

    const goToSlide = (index: number) => {
        setHandpickedIndex(index)
    }

    // Malaysian locations for explore section
    const locations = [
        'Kuala Lumpur', 'Selangor', 'Penang', 'Johor',
        'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
        'Pahang', 'Perak', 'Perlis', 'Putrajaya',
        'Sabah', 'Sarawak', 'Terengganu'
    ]

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (searchQuery.trim()) {
            params.set('search', searchQuery)
        }
        if (propertyType !== 'all') {
            params.set('type', propertyType)
        }
        if (priceRange) {
            params.set('price', priceRange)
        }
        if (bedrooms) {
            params.set('bedrooms', bedrooms)
        }
        if (selectedState) {
            params.set('state', selectedState)
        }
        // Listing type filter removed - data not available yet
        const queryString = params.toString()
        window.location.href = `/properties${queryString ? `?${queryString}` : ''}`
    }

    // Property type options
    const propertyTypes = [
        { value: 'all', label: 'All Residential' },
        { value: 'condo', label: 'Condominium' },
        { value: 'apartment', label: 'Apartment' },
        { value: 'terrace', label: 'Terrace House' },
        { value: 'semi-d', label: 'Semi-D' },
        { value: 'bungalow', label: 'Bungalow' },
        { value: 'townhouse', label: 'Townhouse' },
    ]

    // Price range options
    const priceRanges = [
        { value: '', label: 'Any Price' },
        { value: '0-300000', label: 'Below RM 300K' },
        { value: '300000-500000', label: 'RM 300K - 500K' },
        { value: '500000-800000', label: 'RM 500K - 800K' },
        { value: '800000-1000000', label: 'RM 800K - 1M' },
        { value: '1000000-2000000', label: 'RM 1M - 2M' },
        { value: '2000000+', label: 'Above RM 2M' },
    ]

    // Bedroom options
    const bedroomOptions = [
        { value: '', label: 'Any Bedroom' },
        { value: '1', label: '1 Bedroom' },
        { value: '2', label: '2 Bedrooms' },
        { value: '3', label: '3 Bedrooms' },
        { value: '4', label: '4 Bedrooms' },
        { value: '5+', label: '5+ Bedrooms' },
    ]

    // Malaysian states options (same as locations array but with empty option)
    const stateOptions = [
        { value: '', label: 'Any Location' },
        { value: 'Kuala Lumpur', label: 'Kuala Lumpur' },
        { value: 'Selangor', label: 'Selangor' },
        { value: 'Penang', label: 'Penang' },
        { value: 'Johor', label: 'Johor' },
        { value: 'Kedah', label: 'Kedah' },
        { value: 'Kelantan', label: 'Kelantan' },
        { value: 'Melaka', label: 'Melaka' },
        { value: 'Negeri Sembilan', label: 'Negeri Sembilan' },
        { value: 'Pahang', label: 'Pahang' },
        { value: 'Perak', label: 'Perak' },
        { value: 'Perlis', label: 'Perlis' },
        { value: 'Putrajaya', label: 'Putrajaya' },
        { value: 'Sabah', label: 'Sabah' },
        { value: 'Sarawak', label: 'Sarawak' },
        { value: 'Terengganu', label: 'Terengganu' },
    ]

    // Close dropdowns when clicking outside
    const closeAllDropdowns = () => {
        setShowPropertyTypeDropdown(false)
        setShowPriceDropdown(false)
        setShowBedroomDropdown(false)
        setShowStateDropdown(false)
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Search Section - Clean Light Style */}
            <section className="relative bg-gradient-to-b from-rose-50 via-pink-50 to-orange-50">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-pink-100/50 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl"></div>
                </div>

                <div className="container-custom relative z-10 py-16 md:py-24">
                    {/* Hero Title */}
                    <div className="text-center mb-8">
                        <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl text-gray-900 mb-4">
                            Find Your Dream <span className="text-rose-500">Home</span>
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            Discover the perfect property from thousands of listings across Malaysia
                        </p>
                    </div>

                    {/* Search Container */}
                    <div className="max-w-4xl mx-auto">
                        {/* Buy/Rent toggle removed - will be added when listing_type data is available */}

                        {/* Main Search Box */}
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                            <div className="flex flex-col md:flex-row gap-3">
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        id="property-search"
                                        name="search"
                                        type="text"
                                        placeholder="Search by location, property name, or keyword..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                                        suppressHydrationWarning
                                    />
                                </div>
                                {/* Search Button */}
                                <button
                                    onClick={handleSearch}
                                    className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="hidden md:inline">Search</span>
                                </button>
                            </div>

                            {/* Quick Filters */}
                            <div ref={filterRef} className="flex flex-wrap gap-2 mt-4">
                                {/* Property Type Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowPropertyTypeDropdown(!showPropertyTypeDropdown)
                                            setShowPriceDropdown(false)
                                            setShowBedroomDropdown(false)
                                        }}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${propertyType !== 'all'
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        {propertyTypes.find(t => t.value === propertyType)?.label || 'All Residential'}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showPropertyTypeDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[9999] max-h-64 overflow-y-auto">
                                            {propertyTypes.map((type) => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => {
                                                        setPropertyType(type.value)
                                                        setShowPropertyTypeDropdown(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition-colors ${propertyType === type.value ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Price Range Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowPriceDropdown(!showPriceDropdown)
                                            setShowPropertyTypeDropdown(false)
                                            setShowBedroomDropdown(false)
                                        }}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${priceRange
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-700'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {priceRanges.find(p => p.value === priceRange)?.label || 'Price'}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showPriceDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[9999] max-h-64 overflow-y-auto">
                                            {priceRanges.map((price) => (
                                                <button
                                                    key={price.value}
                                                    onClick={() => {
                                                        setPriceRange(price.value)
                                                        setShowPriceDropdown(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition-colors ${priceRange === price.value ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {price.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Bedroom Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowBedroomDropdown(!showBedroomDropdown)
                                            setShowPropertyTypeDropdown(false)
                                            setShowPriceDropdown(false)
                                        }}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${bedrooms
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-700'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                        </svg>
                                        {bedroomOptions.find(b => b.value === bedrooms)?.label || 'Bedroom'}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showBedroomDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[9999] max-h-64 overflow-y-auto">
                                            {bedroomOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setBedrooms(option.value)
                                                        setShowBedroomDropdown(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition-colors ${bedrooms === option.value ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* State/Location Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => {
                                            setShowStateDropdown(!showStateDropdown)
                                            setShowPropertyTypeDropdown(false)
                                            setShowPriceDropdown(false)
                                            setShowBedroomDropdown(false)
                                        }}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedState
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-pink-50 hover:text-pink-700'
                                            }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {stateOptions.find(s => s.value === selectedState)?.label || 'Location'}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showStateDropdown && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-[9999] max-h-64 overflow-y-auto">
                                            {stateOptions.map((state) => (
                                                <button
                                                    key={state.value}
                                                    onClick={() => {
                                                        setSelectedState(state.value)
                                                        setShowStateDropdown(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-pink-50 transition-colors ${selectedState === state.value ? 'text-pink-600 font-medium bg-pink-50' : 'text-gray-700'
                                                        }`}
                                                >
                                                    {state.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </section>


            {/* "We'll See You Home" Section */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Callout Cards */}
                        <div>
                            <h2 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mb-6">
                                We&apos;ll See You Home
                            </h2>
                            <div className="space-y-4">
                                {/* Property Guides Card */}
                                <Link href="/properties" className="group block">
                                    <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-rose-200 transition-all">
                                        <div className="flex items-center">
                                            <div className="w-1/3 h-32 relative overflow-hidden">
                                                <img
                                                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
                                                    alt="Property Guides"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 p-6">
                                                <h4 className="font-bold text-lg mb-1 text-gray-900">Property Guides</h4>
                                                <p className="text-gray-600 text-sm mb-3">Discover essential property tips, tools and how-to articles</p>
                                                <span className="inline-flex items-center text-rose-500 text-sm font-medium group-hover:underline">
                                                    Read Them Now
                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Find Agents Card */}
                                <Link href="/agents" className="group block">
                                    <div className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-rose-200 transition-all">
                                        <div className="flex items-center">
                                            <div className="w-1/3 h-32 relative overflow-hidden">
                                                <img
                                                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop"
                                                    alt="Find Agents"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 p-6">
                                                <h4 className="font-bold text-lg mb-1 text-gray-900">Find Property Agents</h4>
                                                <p className="text-gray-600 text-sm mb-3">Connect with verified property experts in your area</p>
                                                <span className="inline-flex items-center text-rose-500 text-sm font-medium group-hover:underline">
                                                    Browse Agents
                                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Right Column - Trust Banner */}
                        <div className="flex flex-col">
                            <h3 className="font-heading font-bold text-xl text-gray-900 mb-4">Trust Starts Here</h3>
                            <div className="flex-1 bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/50 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl mb-4">🏠</div>
                                    <h4 className="font-bold text-2xl mb-3 text-gray-900">Verified Listings</h4>
                                    <p className="text-gray-600 mb-6">
                                        All our property listings are verified for authenticity.
                                        Buy or rent with confidence on SuperHomes.
                                    </p>
                                    <Link
                                        href="/properties"
                                        className="inline-flex items-center bg-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-rose-600 transition-colors"
                                    >
                                        Explore Properties
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Properties Section - PropertyGuru Style */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-heading font-bold text-2xl md:text-3xl text-gray-900">Featured Properties</h2>
                        <Link href="/properties" className="text-primary-600 font-semibold hover:text-primary-700 hidden md:flex items-center gap-1">
                            View More
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <PropertyCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
                            {featuredProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}

                    <div className="text-center mt-8 md:hidden">
                        <Link href="/properties" className="btn-primary">
                            View More Properties
                        </Link>
                    </div>
                </div>
            </section>

            {/* Handpicked For You - Grey Background with Carousel */}
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="font-heading font-bold text-2xl md:text-3xl text-gray-900">Handpicked For You</h2>
                        <Link href="/properties" className="text-primary-600 font-semibold hover:text-primary-700 hidden md:flex items-center gap-1">
                            View All
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <PropertyCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Horizontal Scrolling Carousel Container */}
                            <div className="relative">
                                {/* Left Arrow */}
                                {totalSlides > 1 && (
                                    <button
                                        onClick={goToPrevSlide}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-5 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600 transition-all"
                                        aria-label="Previous properties"
                                    >
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                )}

                                {/* Carousel Track - Horizontal Scroll with CSS Transform */}
                                <div className="overflow-hidden">
                                    <div
                                        className="flex transition-transform duration-500 ease-out"
                                        style={{ transform: `translateX(-${handpickedIndex * 100}%)` }}
                                    >
                                        {/* Each slide contains 4 properties */}
                                        {Array.from({ length: totalSlides }).map((_, slideIndex) => (
                                            <div
                                                key={slideIndex}
                                                className="w-full flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1"
                                            >
                                                {handpickedProperties
                                                    .slice(slideIndex * 4, slideIndex * 4 + 4)
                                                    .map((property) => (
                                                        <PropertyCard key={property.id} property={property} />
                                                    ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Arrow */}
                                {totalSlides > 1 && (
                                    <button
                                        onClick={goToNextSlide}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-5 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600 transition-all"
                                        aria-label="Next properties"
                                    >
                                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Dot Navigation */}
                            {totalSlides > 1 && (
                                <div className="flex justify-center items-center gap-3 mt-8">
                                    {Array.from({ length: totalSlides }).map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => goToSlide(index)}
                                            className={`h-3 rounded-full transition-all duration-300 ${index === handpickedIndex
                                                ? 'bg-primary-600 w-10'
                                                : 'bg-gray-300 hover:bg-gray-400 w-3'
                                                }`}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Quick Access Cards */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/properties" className="group">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-rose-200 transition-all">
                                <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-rose-500 transition-colors">Properties for Sale</h3>
                                <p className="text-gray-600 text-sm">Find your dream home with comprehensive property listings</p>
                            </div>
                        </Link>

                        <Link href="/properties?type=rent" className="group">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-pink-200 transition-all">
                                <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-pink-500 transition-colors">Properties for Rent</h3>
                                <p className="text-gray-600 text-sm">Discover condos, apartments, and landed homes for rent</p>
                            </div>
                        </Link>

                        <Link href="/agents" className="group">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
                                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-gray-700 transition-colors">Find an Agent</h3>
                                <p className="text-gray-600 text-sm">Connect with experienced property agents in your area</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Explore Residential Areas */}
            <section className="py-12 md:py-16 border-t border-gray-100">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading font-bold text-xl md:text-2xl text-gray-900">Explore Residential Areas In Malaysia</h2>
                        <Link href="/properties" className="text-rose-500 font-semibold text-sm hover:text-rose-600 hidden md:flex items-center gap-1">
                            More
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {locations.map((location) => (
                            <Link
                                key={location}
                                href={`/properties?state=${encodeURIComponent(location)}`}
                                className="text-gray-600 hover:text-rose-500 text-sm py-2 transition-colors"
                            >
                                {location}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEO Info Cards */}
            <section className="py-12 md:py-16 bg-gray-50 border-t border-gray-100">
                <div className="container-custom">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Properties for Sale</h3>
                            <p className="text-gray-600 text-sm">Find your dream home with comprehensive property listings for sale including condos, terrace houses, apartments, and bungalows.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Properties For Rent</h3>
                            <p className="text-gray-600 text-sm">Looking to rent? Explore our comprehensive list of condos, apartments, service residences, and terrace houses for rent.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Verified Listings</h3>
                            <p className="text-gray-600 text-sm">All listings are verified for authenticity. Read honest reviews and explore options to obtain your dream home with confidence.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Property Guides</h3>
                            <p className="text-gray-600 text-sm">Stay informed with our property guides on buying, selling, renting and financing for a property you can call home.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-to-b from-rose-50 via-pink-50 to-white relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-1/4 w-64 h-64 bg-rose-100/50 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl"></div>
                </div>
                <div className="container-custom relative z-10 text-center">
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-gray-900 mb-4">
                        Ready to Find Your Dream Home?
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied homeowners who found their perfect property with SuperHomes
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/properties"
                            className="bg-rose-500 text-white font-semibold px-8 py-4 rounded-lg hover:bg-rose-600 hover:shadow-xl transition-all"
                        >
                            Browse Properties
                        </Link>
                        <Link
                            href="/register"
                            className="border-2 border-rose-500 text-rose-500 font-semibold px-8 py-4 rounded-lg hover:bg-rose-500 hover:text-white transition-all"
                        >
                            Register as Agent
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
