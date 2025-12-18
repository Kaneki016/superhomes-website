'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white py-20">
                <div className="container-custom text-center">
                    <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
                        About SuperHomes
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
                        Your trusted partner in finding the perfect property in Malaysia
                    </p>
                </div>
            </section>

            <div className="container-custom py-16">
                {/* Mission Section */}
                <section className="mb-20">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="font-heading font-bold text-3xl text-gray-900 mb-6">
                                Our Mission
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed mb-4">
                                At SuperHomes, we believe everyone deserves to find their dream home.
                                Our mission is to simplify the property search experience in Malaysia
                                by providing a comprehensive, user-friendly platform that connects
                                buyers with their ideal properties.
                            </p>
                            <p className="text-gray-600 text-lg leading-relaxed">
                                Whether you&apos;re looking for a cozy apartment in Kuala Lumpur, a
                                spacious landed property in Selangor, or a commercial space for
                                your business, SuperHomes has you covered.
                            </p>
                        </div>
                        <div className="glass p-8 rounded-2xl">
                            <div className="grid grid-cols-2 gap-6 text-center">
                                <div className="p-4">
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">1000+</p>
                                    <p className="text-gray-600 mt-2">Properties Listed</p>
                                </div>
                                <div className="p-4">
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">500+</p>
                                    <p className="text-gray-600 mt-2">Trusted Agents</p>
                                </div>
                                <div className="p-4">
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">14</p>
                                    <p className="text-gray-600 mt-2">States Covered</p>
                                </div>
                                <div className="p-4">
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">24/7</p>
                                    <p className="text-gray-600 mt-2">Support Available</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Why Choose Us */}
                <section className="mb-20">
                    <h2 className="font-heading font-bold text-3xl text-gray-900 text-center mb-12">
                        Why Choose SuperHomes?
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="glass p-8 rounded-2xl text-center hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="font-heading font-bold text-xl mb-3">Easy Search</h3>
                            <p className="text-gray-600">
                                Our powerful search filters help you find exactly what you&apos;re looking for,
                                from location to price range and property type.
                            </p>
                        </div>

                        <div className="glass p-8 rounded-2xl text-center hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="font-heading font-bold text-xl mb-3">Verified Listings</h3>
                            <p className="text-gray-600">
                                All our listings are verified to ensure you get accurate information
                                about every property on our platform.
                            </p>
                        </div>

                        <div className="glass p-8 rounded-2xl text-center hover:shadow-xl transition-shadow">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-6">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="font-heading font-bold text-xl mb-3">Expert Agents</h3>
                            <p className="text-gray-600">
                                Connect with experienced real estate agents who know the Malaysian
                                property market inside and out.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Coverage Areas */}
                <section className="mb-20">
                    <h2 className="font-heading font-bold text-3xl text-gray-900 text-center mb-12">
                        We Cover All of Malaysia
                    </h2>
                    <div className="glass p-8 rounded-2xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-center">
                            {[
                                'Kuala Lumpur', 'Selangor', 'Penang', 'Johor',
                                'Perak', 'Sabah', 'Sarawak', 'Melaka',
                                'Negeri Sembilan', 'Pahang', 'Kedah', 'Kelantan',
                                'Terengganu', 'Perlis'
                            ].map((state) => (
                                <div
                                    key={state}
                                    className="p-3 bg-gray-50 rounded-lg hover:bg-primary-50 hover:text-primary-600 transition-colors cursor-pointer"
                                >
                                    <p className="font-medium text-sm">{state}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact CTA */}
                <section className="text-center">
                    <div className="glass p-12 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50">
                        <h2 className="font-heading font-bold text-3xl text-gray-900 mb-4">
                            Ready to Find Your Dream Home?
                        </h2>
                        <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                            Start your property search today or get in touch with our team for personalized assistance.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/properties" className="btn-primary">
                                Browse Properties
                            </Link>
                            <Link href="/agents" className="btn-secondary">
                                Find an Agent
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <Footer />
        </div>
    )
}
