'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProjectCard from '@/components/ProjectCard'
import { Property } from '@/lib/supabase'
import { getNewProjects, getDistinctStates } from '@/lib/database'

export default function NewProjectsPage() {
    const [projects, setProjects] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [stateOptions, setStateOptions] = useState<string[]>([])
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        state: '',
        tenure: '',
    })
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)

    // Load projects
    useEffect(() => {
        async function loadData() {
            setLoading(true)
            console.log('Loading new projects with filters:', filters)
            try {
                // Load separately to debug
                console.log('Fetching new projects...')
                const projectsData = await getNewProjects(filters)
                console.log('New projects fetched:', projectsData.length)
                setProjects(projectsData)

                console.log('Fetching states...')
                const states = await getDistinctStates()
                console.log('States fetched:', states.length)
                setStateOptions(states)
            } catch (error) {
                console.error('Error loading projects:', error)
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

    const propertyTypes = ['Condominium', 'Service Residence', 'Apartment', 'Terraced House', 'Semi-D', 'Bungalow']
    const tenureOptions = ['Freehold', 'Leasehold']
    const bedroomOptions = ['1', '2', '3', '4', '5+']
    const priceRanges = [
        { label: 'Under RM 300K', min: '', max: '300000' },
        { label: 'RM 300K - 500K', min: '300000', max: '500000' },
        { label: 'RM 500K - 800K', min: '500000', max: '800000' },
        { label: 'RM 800K - 1M', min: '800000', max: '1000000' },
        { label: 'Above RM 1M', min: '1000000', max: '' },
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
            tenure: '',
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
                            Find your future home
                        </h1>
                        <p className="text-xl text-white/80 mb-8">
                            Explore new and upcoming property launches in Malaysia
                        </p>

                        {/* Search Box */}
                        <div className="max-w-2xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search by project name or location..."
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
                                    <span>{filters.minPrice || filters.maxPrice ? 'Price Set' : 'Price'}</span>
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
                                                {bed} Bedroom{bed !== '1' ? 's' : ''}
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

                            {/* Tenure */}
                            <div className="filter-dropdown relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdown(openDropdown === 'tenure' ? null : 'tenure')
                                    }}
                                    className={`filter-pill ${filters.tenure ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>{filters.tenure || 'Tenure'}</span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'tenure' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'tenure' && (
                                    <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                                        <button
                                            onClick={() => handleFilterChange('tenure', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.tenure ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            Any Tenure
                                        </button>
                                        {tenureOptions.map(tenure => (
                                            <button
                                                key={tenure}
                                                onClick={() => handleFilterChange('tenure', tenure)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.tenure === tenure ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                            >
                                                {tenure}
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

                {/* Projects Grid */}
                <section className="py-8">
                    <div className="container-custom">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-heading font-bold text-gray-900">
                                {loading ? 'Loading...' : `${projects.length} New Projects`}
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
                                    Coming Soon
                                </h3>

                                {/* Description */}
                                <p className="text-gray-600 text-center max-w-md mb-6">
                                    We&apos;re working on bringing you the latest new property launches in Malaysia.
                                    This feature will be available soon!
                                </p>

                                {/* Badge */}
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                                    <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Under Development
                                </span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {projects.map(project => (
                                    <ProjectCard key={project.id} property={project} />
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}
