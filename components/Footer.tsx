'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getDistinctPropertyTypesByListingType } from '@/app/actions/property-actions'
import { slugify } from '@/lib/slugUtils'

// Malaysian states for footer navigation
const MALAYSIAN_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur',
    'Labuan', 'Melaka', 'Negeri Sembilan', 'Pahang',
    'Penang', 'Perak', 'Perlis', 'Putrajaya',
    'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
]

export default function Footer() {
    const [showAllStates, setShowAllStates] = useState(false)
    const [showAllSaleTypes, setShowAllSaleTypes] = useState(false)
    const [showAllRentTypes, setShowAllRentTypes] = useState(false)
    const [salePropertyTypes, setSalePropertyTypes] = useState<string[]>([])
    const [rentPropertyTypes, setRentPropertyTypes] = useState<string[]>([])

    useEffect(() => {
        // Fetch property types for sale listings
        getDistinctPropertyTypesByListingType('sale').then(types => {
            setSalePropertyTypes(types)
        }).catch(error => {
            console.error('Error fetching sale property types:', error)
            setSalePropertyTypes(['Apartment', 'Bungalow', 'Condominium', 'Terraced House'])
        })

        // Fetch property types for rent listings
        getDistinctPropertyTypesByListingType('rent').then(types => {
            setRentPropertyTypes(types)
        }).catch(error => {
            console.error('Error fetching rent property types:', error)
            setRentPropertyTypes(['Apartment', 'Condominium', 'Studio'])
        })
    }, [])

    return (
        <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20 border-t border-gray-700">
            <div className="container-custom py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Column 1: About SuperHomes */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Image
                                src="/logo-icon.svg"
                                alt="SuperHomes Logo"
                                width={40}
                                height={40}
                                className="w-10 h-10"
                            />
                            <span className="font-heading font-bold text-2xl bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                                SuperHomes
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Malaysia&apos;s premier property marketplace. Discover your dream home with our extensive listings and expert agents.
                        </p>
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>+60 12-679 1203</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Kuala Lumpur, Malaysia</span>
                            </div>
                        </div>
                        <a
                            href="https://wa.me/60126791203?text=Hi%20SuperHomes%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all hover:scale-105 shadow-lg"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp Us
                        </a>
                    </div>

                    {/* Column 2: Browse by State */}
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-6 text-white">Browse by State</h3>
                        <ul className="space-y-3">
                            {MALAYSIAN_STATES.slice(0, showAllStates ? MALAYSIAN_STATES.length : 6).map((state) => (
                                <li key={state}>
                                    <Link
                                        href={`/properties/${slugify(state)}`}
                                        className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group"
                                    >
                                        <svg className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        {state}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {MALAYSIAN_STATES.length > 6 && (
                            <button
                                onClick={() => setShowAllStates(!showAllStates)}
                                className="mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-2 transition-colors group"
                            >
                                {showAllStates ? (
                                    <>
                                        <span>Show Less</span>
                                        <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>View More States</span>
                                        <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Column 3: Property Types for Sale */}
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-6 text-white">Properties for Sale</h3>
                        <ul className="space-y-3">
                            {salePropertyTypes.slice(0, showAllSaleTypes ? salePropertyTypes.length : 5).map((type: string) => (
                                <li key={type}>
                                    <Link
                                        href={`/properties/${slugify(type)}`}
                                        className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group"
                                    >
                                        <svg className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        {type}s for Sale
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {salePropertyTypes.length > 5 && (
                            <button
                                onClick={() => setShowAllSaleTypes(!showAllSaleTypes)}
                                className="mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-2 transition-colors group"
                            >
                                {showAllSaleTypes ? (
                                    <>
                                        <span>Show Less</span>
                                        <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>View More</span>
                                        <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Column 4: Property Types for Rent */}
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-6 text-white">Properties for Rent</h3>
                        <ul className="space-y-3">
                            {rentPropertyTypes.slice(0, showAllRentTypes ? rentPropertyTypes.length : 5).map((type: string) => (
                                <li key={type}>
                                    <Link
                                        href={`/rent/${slugify(type)}`}
                                        className="text-gray-400 hover:text-primary-400 transition-colors text-sm flex items-center gap-2 group"
                                    >
                                        <svg className="w-4 h-4 text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        {type}s for Rent
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {rentPropertyTypes.length > 5 && (
                            <button
                                onClick={() => setShowAllRentTypes(!showAllRentTypes)}
                                className="mt-4 text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-2 transition-colors group"
                            >
                                {showAllRentTypes ? (
                                    <>
                                        <span>Show Less</span>
                                        <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                        </svg>
                                    </>
                                ) : (
                                    <>
                                        <span>View More</span>
                                        <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Links Row */}
                <div className="border-t border-gray-700 pt-8 mb-8">
                    <div className="flex flex-wrap gap-6 justify-center text-sm">
                        <Link href="/properties" className="text-gray-400 hover:text-white transition-colors">
                            Browse Properties
                        </Link>
                        <Link href="/rent" className="text-gray-400 hover:text-white transition-colors">
                            Rental Properties
                        </Link>
                        <Link href="/new-projects" className="text-gray-400 hover:text-white transition-colors">
                            New Projects
                        </Link>
                        <Link href="/agents" className="text-gray-400 hover:text-white transition-colors">
                            Find Agents
                        </Link>
                        <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                            About Us
                        </Link>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-400 text-sm">
                        &copy; 2026 SuperHomes Malaysia. All rights reserved.
                    </div>
                    <div className="flex gap-6 text-sm">
                        <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
