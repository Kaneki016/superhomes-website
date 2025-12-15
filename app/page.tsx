'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { getFeaturedProperties } from '@/lib/database'
import { Property } from '@/lib/supabase'
// Fallback to mock data if database is empty
import { mockProperties } from '@/lib/mockData'

export default function HomePage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        async function loadProperties() {
            try {
                const dbProperties = await getFeaturedProperties()
                // Use database properties if available, otherwise use mock data
                if (dbProperties.length > 0) {
                    setProperties(dbProperties)
                } else {
                    setProperties(mockProperties.slice(0, 8))
                }
            } catch (error) {
                console.error('Error loading properties:', error)
                setProperties(mockProperties.slice(0, 8))
            } finally {
                setLoading(false)
            }
        }
        loadProperties()
    }, [])

    const featuredProperties = properties.slice(0, 4)
    const recentProperties = properties.slice(0, 4)

    // Malaysian locations for explore section
    const locations = [
        'Kuala Lumpur', 'Selangor', 'Penang', 'Johor',
        'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan',
        'Pahang', 'Perak', 'Perlis', 'Putrajaya',
        'Sabah', 'Sarawak', 'Terengganu'
    ]

    const handleSearch = () => {
        if (searchQuery.trim()) {
            window.location.href = `/properties?search=${encodeURIComponent(searchQuery)}`
        } else {
            window.location.href = '/properties'
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Search Section - PropertyGuru Style */}
            <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="container-custom relative z-10 py-12 md:py-20">
                    {/* Search Container */}
                    <div className="max-w-4xl mx-auto">
                        {/* Buy/Rent Tabs */}
                        <div className="flex mb-4">
                            <button
                                onClick={() => setActiveTab('buy')}
                                className={`px-8 py-3 font-semibold text-sm rounded-t-lg transition-all ${activeTab === 'buy'
                                    ? 'bg-white text-primary-600'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setActiveTab('rent')}
                                className={`px-8 py-3 font-semibold text-sm rounded-t-lg transition-all ${activeTab === 'rent'
                                    ? 'bg-white text-primary-600'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                Rent
                            </button>
                        </div>

                        {/* Main Search Box */}
                        <div className="bg-white rounded-xl rounded-tl-none shadow-2xl p-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by location, property name, or keyword..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                                    />
                                </div>
                                {/* Search Button */}
                                <button
                                    onClick={handleSearch}
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <span className="hidden md:inline">Search</span>
                                </button>
                            </div>

                            {/* Quick Filters */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium hover:bg-primary-100 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    All Residential
                                </button>
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Price
                                </button>
                                <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                    Bedroom
                                </button>
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
                                    <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl overflow-hidden">
                                        <div className="flex items-center">
                                            <div className="w-1/3 h-32 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-blue-600/80 z-10"></div>
                                                <img
                                                    src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
                                                    alt="Property Guides"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 p-6 text-white">
                                                <h4 className="font-bold text-lg mb-1">Property Guides</h4>
                                                <p className="text-white/80 text-sm mb-3">Discover essential property tips, tools and how-to articles</p>
                                                <span className="inline-flex items-center text-sm font-medium group-hover:underline">
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
                                    <div className="relative bg-gradient-to-r from-rose-600 to-rose-800 rounded-2xl overflow-hidden">
                                        <div className="flex items-center">
                                            <div className="w-1/3 h-32 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-rose-600/80 z-10"></div>
                                                <img
                                                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop"
                                                    alt="Find Agents"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 p-6 text-white">
                                                <h4 className="font-bold text-lg mb-1">Find Property Agents</h4>
                                                <p className="text-white/80 text-sm mb-3">Connect with verified property experts in your area</p>
                                                <span className="inline-flex items-center text-sm font-medium group-hover:underline">
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
                            <div className="flex-1 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10">
                                    <div className="text-4xl mb-4">🏠</div>
                                    <h4 className="font-bold text-2xl mb-3">Verified Listings</h4>
                                    <p className="text-white/80 mb-6">
                                        All our property listings are verified for authenticity.
                                        Buy or rent with confidence on SuperHomes.
                                    </p>
                                    <Link
                                        href="/properties"
                                        className="inline-flex items-center bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
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
                                <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* Handpicked For You - Grey Background */}
            <section className="py-12 md:py-16 bg-gray-50">
                <div className="container-custom">
                    <h2 className="font-heading font-bold text-2xl md:text-3xl text-gray-900 mb-8">Handpicked For You</h2>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {recentProperties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Access Cards */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/properties" className="group">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-primary-200 transition-all">
                                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">Properties for Sale</h3>
                                <p className="text-gray-600 text-sm">Find your dream home with comprehensive property listings</p>
                            </div>
                        </Link>

                        <Link href="/properties?type=rent" className="group">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-primary-200 transition-all">
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">Properties for Rent</h3>
                                <p className="text-gray-600 text-sm">Discover condos, apartments, and landed homes for rent</p>
                            </div>
                        </Link>

                        <Link href="/agents" className="group">
                            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-primary-200 transition-all">
                                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-primary-600 transition-colors">Find an Agent</h3>
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
                        <Link href="/properties" className="text-primary-600 font-semibold text-sm hover:text-primary-700 hidden md:flex items-center gap-1">
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
                                href={`/properties?location=${encodeURIComponent(location)}`}
                                className="text-gray-600 hover:text-primary-600 text-sm py-2 transition-colors"
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
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">Properties for Sale</h3>
                            <p className="text-gray-600 text-sm">Find your dream home with comprehensive property listings for sale including condos, terrace houses, apartments, and bungalows.</p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="container-custom relative z-10 text-center">
                    <h2 className="font-heading font-bold text-3xl md:text-4xl text-white mb-4">
                        Ready to Find Your Dream Home?
                    </h2>
                    <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied homeowners who found their perfect property with SuperHomes
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/properties"
                            className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:shadow-xl transition-all"
                        >
                            Browse Properties
                        </Link>
                        <Link
                            href="/register"
                            className="border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transition-all"
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
