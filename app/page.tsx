import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SearchBar from '@/components/SearchBar'
import PropertyCard from '@/components/PropertyCard'
import { getFeaturedProperties, getRecentProperties } from '@/lib/mockData'

export default function HomePage() {
    const featuredProperties = getFeaturedProperties()
    const recentProperties = getRecentProperties()

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/20">
            <Navbar />

            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10"></div>
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in">
                        <h1 className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl mb-6 bg-gradient-primary bg-clip-text text-transparent">
                            Find Your Dream Home
                        </h1>
                        <p className="text-xl text-gray-600 mb-8">
                            Discover the perfect property from thousands of listings across Malaysia
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className="max-w-5xl mx-auto animate-slide-up">
                        <SearchBar />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
                        {[
                            { label: 'Properties', value: '10,000+' },
                            { label: 'Happy Clients', value: '5,000+' },
                            { label: 'Expert Agents', value: '500+' },
                            { label: 'Cities Covered', value: '50+' },
                        ].map((stat, index) => (
                            <div key={index} className="glass p-6 rounded-xl text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                                <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </p>
                                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quick Access Cards */}
            <section className="py-16 bg-white">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Link href="/properties" className="group">
                            <div className="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-2xl mb-3 text-gray-900">Buy Property</h3>
                                <p className="text-gray-600">Browse thousands of properties and find your perfect home</p>
                            </div>
                        </Link>

                        <Link href="/sell" className="group">
                            <div className="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-2xl mb-3 text-gray-900">Sell Property</h3>
                                <p className="text-gray-600">List your property and reach thousands of potential buyers</p>
                            </div>
                        </Link>

                        <Link href="/agents" className="group">
                            <div className="glass p-8 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-2xl mb-3 text-gray-900">Agent Directory</h3>
                                <p className="text-gray-600">Connect with experienced property agents in your area</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Featured Properties */}
            <section className="py-16">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="font-heading font-bold text-4xl text-gray-900 mb-2">Featured Properties</h2>
                            <p className="text-gray-600">Handpicked premium properties just for you</p>
                        </div>
                        <Link href="/properties" className="btn-secondary hidden md:block">
                            View All
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>

                    <div className="text-center mt-8 md:hidden">
                        <Link href="/properties" className="btn-primary">
                            View All Properties
                        </Link>
                    </div>
                </div>
            </section>

            {/* Recent Listings */}
            <section className="py-16 bg-white">
                <div className="container-custom">
                    <div className="mb-10">
                        <h2 className="font-heading font-bold text-4xl text-gray-900 mb-2">New & Recent Listings</h2>
                        <p className="text-gray-600">Fresh properties added to our marketplace</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recentProperties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-primary relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
                </div>
                <div className="container-custom relative z-10 text-center">
                    <h2 className="font-heading font-bold text-4xl md:text-5xl text-white mb-6">
                        Ready to Find Your Dream Home?
                    </h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join thousands of satisfied homeowners who found their perfect property with SuperHomes
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/properties" className="bg-white text-primary-600 font-semibold px-8 py-4 rounded-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                            Browse Properties
                        </Link>
                        <Link href="/register" className="bg-transparent border-2 border-white text-white font-semibold px-8 py-4 rounded-lg hover:bg-white hover:text-primary-600 transition-all duration-300">
                            Register as Agent
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}
