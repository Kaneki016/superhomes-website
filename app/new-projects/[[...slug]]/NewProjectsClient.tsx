'use client'

import { useSearchParams, useRouter, useParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense, useCallback } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProjectCard from '@/components/ProjectCard'
import Pagination from '@/components/Pagination'
import SearchInput from '@/components/SearchInput'
import FilterChips from '@/components/FilterChips'
import FilterModal from '@/components/FilterModal'
import { Property } from '@/lib/types'
import { getPropertiesPaginated, getDistinctStates, getFilterOptions } from '@/app/actions/property-actions'
import { ListSkeleton } from '@/components/SkeletonLoader'
import PageBanner from '@/components/PageBanner'

const ITEMS_PER_PAGE = 12

export default function NewProjectsClient() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-6">
                    <ListSkeleton count={8} type="property" />
                </div>
                <Footer />
            </div>
        }>
            <NewProjectsContent />
        </Suspense>
    )
}

function NewProjectsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const params = useParams()

    // Slug parsing
    const slug = params?.slug as string[] | undefined

    const [projects, setProjects] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [totalCount, setTotalCount] = useState(0)
    const [stateOptions, setStateOptions] = useState<string[]>([])

    // Filters State matches PropertiesClientPage structure
    const [filters, setFilters] = useState({
        propertyType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
        state: '',
        tenure: '',
        location: '' // Standardized naming (was 'search')
    })

    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [filterModalOpen, setFilterModalOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const [mobileSearchExpanded, setMobileSearchExpanded] = useState(true)
    const lastScrollY = useRef(0)
    const scrollCooldown = useRef(0)

    // Auto-collapse/expand filter bar on scroll (mobile only)
    useEffect(() => {
        const handleScroll = () => {
            if (window.innerWidth >= 768) return
            const currentY = window.scrollY

            if (currentY > 80) {
                setMobileSearchExpanded(false)
            } else if (currentY <= 60) {
                setMobileSearchExpanded(true)
            }
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])


    const [filterOptions, setFilterOptions] = useState<{
        propertyTypes: string[]
        locations: string[]
        bedrooms: number[]
        priceRange: { min: number; max: number }
    } | null>(null)

    const initialLoadDone = useRef(false)

    // Pagination calculations
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    // Load static options
    useEffect(() => {
        async function loadOptions() {
            try {
                const [states, options] = await Promise.all([
                    getDistinctStates(),
                    getFilterOptions()
                ])
                setStateOptions(states)
                setFilterOptions(options)
            } catch (error) {
                console.error('Error loading options:', error)
            }
        }
        loadOptions()
    }, [])

    // Logic to sync filters TO URL (Clean URL)
    const syncFiltersToUrl = useCallback((filterState: typeof filters) => {
        let path = '/new-projects'

        const typeSlug = filterState.propertyType
            ? (
                filterState.propertyType === 'Service Residence' || filterState.propertyType === 'Serviced Residence' ? 'service-residence' :
                    filterState.propertyType === 'Landed' ? 'landed' :
                        filterState.propertyType === 'Township' ? 'township' :
                            filterState.propertyType.trim().toLowerCase().replace(/ /g, '-')
            )
            : null

        const stateSlug = filterState.state
            ? filterState.state.trim().toLowerCase().replace(/ /g, '-')
            : null

        // URL Structure: 
        // 1. /new-projects/[type]
        // 2. /new-projects/[type]/[state]
        // 3. /new-projects/all-residential/[state] (explicit state with no type)

        if (typeSlug) {
            path += `/${typeSlug}`
            if (stateSlug) path += `/${stateSlug}`
        } else if (stateSlug) {
            path += `/all-residential/${stateSlug}`
        }

        const params = new URLSearchParams()

        if (filterState.location && filterState.location.trim()) params.set('search', filterState.location.trim())

        if (filterState.minPrice && filterState.maxPrice) {
            params.set('price', `${filterState.minPrice}-${filterState.maxPrice}`)
        } else if (filterState.minPrice) {
            params.set('price', `${filterState.minPrice}+`)
        } else if (filterState.maxPrice) {
            params.set('price', `0-${filterState.maxPrice}`)
        }

        if (filterState.bedrooms) params.set('bedrooms', filterState.bedrooms)
        if (filterState.tenure) params.set('tenure', filterState.tenure)

        const queryString = params.toString()
        const finalUrl = `${path}${queryString ? `?${queryString}` : ''}`

        if (window.location.pathname + window.location.search !== finalUrl) {
            router.replace(finalUrl, { scroll: false })
        }
    }, [router])

    // Initialize from URL (Slug + Params)
    useEffect(() => {
        let typeFromSlug = ''
        let stateFromSlug = ''

        if (slug && slug.length > 0) {
            const firstPart = slug[0].toLowerCase()

            const standardStates = [
                'johor', 'kedah', 'kelantan', 'kuala-lumpur', 'labuan', 'melaka',
                'negeri-sembilan', 'pahang', 'penang', 'perak', 'perlis',
                'putrajaya', 'sabah', 'sarawak', 'selangor', 'terengganu'
            ]

            const isState = standardStates.includes(firstPart)

            if (isState) {
                stateFromSlug = firstPart.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            } else if (firstPart === 'all-residential') {
                if (slug.length > 1) {
                    stateFromSlug = slug[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }
            } else {
                // Assume Type
                if (firstPart === 'service-residence') {
                    typeFromSlug = 'Service Residence'
                } else if (firstPart === 'landed') {
                    typeFromSlug = 'Landed'
                } else if (firstPart === 'township') {
                    typeFromSlug = 'Township'
                } else if (firstPart === 'semi-detached-house') {
                    typeFromSlug = 'Semi-Detached House'
                } else if (firstPart.match(/^\d+-storey-terraced-house$/)) {
                    const num = firstPart.split('-')[0]
                    typeFromSlug = `${num}-storey Terraced House`
                } else {
                    // Reconstruct type string (basic handle)
                    const parts = firstPart.split('-')
                    typeFromSlug = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
                    // Fix specific cases
                    typeFromSlug = typeFromSlug.replace(/(\d) Storey/g, '$1-Storey')
                    // Semi D check is redundant if handled above, but keep for safety if slug varies
                    if (typeFromSlug.includes('Semi D')) typeFromSlug = typeFromSlug.replace('Semi D', 'Semi-D')
                    if (typeFromSlug === 'Serviced Residence') typeFromSlug = 'Service Residence'
                }

                if (slug.length > 1) {
                    stateFromSlug = slug[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                }
            }
        }

        // Search Params
        const searchParam = searchParams.get('search')
        const priceParam = searchParams.get('price') || searchParams.get('minPrice') // handle both legacy and new
        const bedroomsParam = searchParams.get('bedrooms')
        const tenureParam = searchParams.get('tenure')
        const stateParam = searchParams.get('state') // fallback/override
        const propertyTypeParam = searchParams.get('propertyType') // fallback/override

        let minPrice = ''
        let maxPrice = ''

        if (searchParams.get('minPrice')) minPrice = searchParams.get('minPrice')!
        if (searchParams.get('maxPrice')) maxPrice = searchParams.get('maxPrice')!

        if (priceParam && !minPrice && !maxPrice) {
            if (priceParam.endsWith('+')) {
                minPrice = priceParam.slice(0, -1)
            } else if (priceParam.includes('-')) {
                const [min, max] = priceParam.split('-')
                minPrice = min
                maxPrice = max
            } else if (priceParam.startsWith('0-')) {
                maxPrice = priceParam.split('-')[1]
            }
        }

        const newFilters = {
            propertyType: propertyTypeParam || typeFromSlug,
            state: stateParam || stateFromSlug,
            location: searchParam || '',
            minPrice,
            maxPrice,
            bedrooms: bedroomsParam || '',
            tenure: tenureParam || ''
        }

        console.log('Applying Filters:', { slug, firstPart: slug?.[0], typeFromSlug, newFilters })

        setFilters(newFilters)

        // Initial Load or Reload on Param Change
        loadProjects(1, true, newFilters)

    }, [slug, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

    // Load Projects Function
    const loadProjects = async (page: number, resetList = false, activeFilters = filters) => {
        setLoading(true)
        try {
            const { properties: projectsData, totalCount: count } = await getPropertiesPaginated(
                page,
                ITEMS_PER_PAGE,
                {
                    location: activeFilters.location,
                    propertyType: activeFilters.propertyType,
                    minPrice: activeFilters.minPrice ? parseInt(activeFilters.minPrice) : undefined,
                    maxPrice: activeFilters.maxPrice ? parseInt(activeFilters.maxPrice) : undefined,
                    bedrooms: activeFilters.bedrooms ? parseInt(activeFilters.bedrooms) : undefined,
                    state: activeFilters.state,
                    tenure: activeFilters.tenure,
                    listingType: 'project'
                },
                true
            )
            setProjects(projectsData)
            setTotalCount(count)
            setCurrentPage(page)
        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value }
        setFilters(newFilters)
        setOpenDropdown(null)
        loadProjects(1, true, newFilters)
        syncFiltersToUrl(newFilters)
    }

    const resetFilters = () => {
        const resetState = {
            propertyType: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            state: '',
            tenure: '',
            location: ''
        }
        setFilters(resetState)
        loadProjects(1, true, resetState)
        syncFiltersToUrl(resetState)
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const propertyTypes = filterOptions?.propertyTypes || []
    const tenureOptions = ['Freehold', 'Leasehold']
    const bedroomOptions = ['Studio', '1', '2', '3', '4', '5+']
    const activeFilterCount = Object.values(filters).filter(v => v !== '').length

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50">
                <PageBanner
                    title={filters.state ? `New Projects in ${filters.state}` : "New Property Launches in Malaysia"}
                    subtitle="Be the first to discover exclusive new developments and pre-launch projects"
                    backgroundImage="https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=2000&q=80"
                />

                {/* Sticky Filter Bar */}
                <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
                    <div
                        className="container-custom py-4 overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out"
                        style={typeof window !== 'undefined' && window.innerWidth >= 768
                            ? { maxHeight: 'none', opacity: 1 }
                            : {
                                maxHeight: mobileSearchExpanded ? '400px' : '0px',
                                opacity: mobileSearchExpanded ? 1 : 0,
                            }
                        }
                    >
                        {/* Search Input */}
                        <div className="flex gap-4 mb-4">
                            <SearchInput
                                value={filters.location}
                                onChange={(val) => setFilters({ ...filters, location: val })}
                                onSearch={(val) => {
                                    const newFilters = { ...filters, location: val }
                                    setFilters(newFilters)
                                    loadProjects(1, true, newFilters)
                                    syncFiltersToUrl(newFilters)
                                }}
                                placeholder="Search new projects by name or location..."
                                className="flex-1"
                            />
                            <button
                                onClick={() => {
                                    loadProjects(1, true, filters)
                                    syncFiltersToUrl(filters)
                                }}
                                className="flex items-center gap-2 px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="font-medium hidden sm:inline">Search</span>
                            </button>
                        </div>

                        {/* Quick Filter Pills */}
                        <div ref={dropdownRef} className="flex items-center gap-3 flex-wrap">
                            {/* Detailed Filters Button (Modal) */}
                            <button
                                onClick={() => setFilterModalOpen(true)}
                                className={`filter-pill ${activeFilterCount > 0 ? 'active' : ''}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className="w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            {/* Property Type Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
                                    className={`filter-pill ${filters.propertyType ? 'active' : ''}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>{filters.propertyType || 'All Residential'}</span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'type' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'type' && (
                                    <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 max-h-64 overflow-y-auto">
                                        <button
                                            onClick={() => handleFilterChange('propertyType', '')}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${!filters.propertyType ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                        >
                                            All Residential
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

                            {/* Price Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
                                    className={`filter-pill ${filters.minPrice || filters.maxPrice ? 'active' : ''}`}
                                >
                                    <span className="font-medium">RM</span>
                                    <span>
                                        {filters.minPrice || filters.maxPrice
                                            ? `RM ${filters.minPrice ? parseInt(filters.minPrice) / 1000 + 'k' : '0'} - ${filters.maxPrice ? parseInt(filters.maxPrice) / 1000 + 'k' : 'Any'}`
                                            : 'Price'}
                                    </span>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${openDropdown === 'price' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openDropdown === 'price' && (
                                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-50">
                                        <div className="flex gap-2 items-center mb-4">
                                            <input
                                                type="number"
                                                placeholder="Min"
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                value={filters.minPrice}
                                                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                                            />
                                            <span className="text-gray-400">-</span>
                                            <input
                                                type="number"
                                                placeholder="Max"
                                                className="w-full border rounded px-2 py-1 text-sm"
                                                value={filters.maxPrice}
                                                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-between">
                                            <button onClick={() => {
                                                const newFilters = { ...filters, minPrice: '', maxPrice: '' }
                                                setFilters(newFilters)
                                                loadProjects(1, true, newFilters)
                                                syncFiltersToUrl(newFilters)
                                            }} className="text-sm text-gray-500 hover:text-gray-700">Clear</button>
                                            <button onClick={() => {
                                                setOpenDropdown(null)
                                                loadProjects(1, true, filters)
                                                syncFiltersToUrl(filters)
                                            }} className="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700">Apply</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bedroom Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'beds' ? null : 'beds')}
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
                                        {['Studio', '1', '2', '3', '4', '5+'].map(bed => (
                                            <button
                                                key={bed}
                                                onClick={() => handleFilterChange('bedrooms', bed === 'Studio' ? '0' : bed.replace('+', ''))}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${filters.bedrooms === bed ? 'text-primary-600 font-medium' : 'text-gray-700'}`}
                                            >
                                                {bed === 'Studio' ? 'Studio' : `${bed} Bedroom${bed !== '1' ? 's' : ''}`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* State Pill */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === 'state' ? null : 'state')}
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

                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetFilters}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                                >
                                    Clear all
                                </button>
                            )}

                        </div>
                    </div>

                    {/* Active Filter Chips */}
                    <div className="container-custom">
                        <FilterChips
                            filters={[
                                filters.location ? { key: 'location', label: 'Search', value: filters.location } : null,
                                filters.state ? { key: 'state', label: 'State', value: filters.state } : null,
                                filters.propertyType ? { key: 'propertyType', label: 'Type', value: filters.propertyType } : null,
                                filters.minPrice || filters.maxPrice ? {
                                    key: 'price',
                                    label: 'Price',
                                    value: filters.minPrice && filters.maxPrice
                                        ? `RM${(parseInt(filters.minPrice) / 1000)}k - RM${(parseInt(filters.maxPrice) / 1000)}k`
                                        : filters.minPrice
                                            ? `Above RM${(parseInt(filters.minPrice) / 1000)}k`
                                            : `Under RM${(parseInt(filters.maxPrice) / 1000)}k`
                                } : null,
                                filters.bedrooms ? { key: 'bedrooms', label: 'Bedrooms', value: `${filters.bedrooms}` } : null,
                                filters.tenure ? { key: 'tenure', label: 'Tenure', value: filters.tenure } : null,
                            ].filter(Boolean) as { key: string; label: string; value: string }[]}
                            onRemove={(key) => {
                                if (key === 'location') handleFilterChange('location', '')
                                else if (key === 'price') {
                                    const newF = { ...filters, minPrice: '', maxPrice: '' }
                                    setFilters(newF)
                                    loadProjects(1, true, newF)
                                    syncFiltersToUrl(newF)
                                }
                                else handleFilterChange(key, '')
                            }}
                            onClearAll={resetFilters}
                        />
                    </div>
                </div>

                {/* Results Section */}
                <div className="container-custom py-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="page-title">{loading ? 'Loading...' : `${totalCount} New Projects`}</h1>
                            <p className="page-subtitle">
                                {!loading && `Showing ${projects.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0} - ${(currentPage - 1) * ITEMS_PER_PAGE + projects.length} of ${totalCount} results`}
                            </p>
                        </div>
                    </div>

                    {/* Content Logic */}
                    {loading ? (
                        <ListSkeleton count={8} type="property" />
                    ) : (
                        <div>
                            {projects.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-4">
                                    <div className="mb-6 p-6 bg-gradient-to-br from-primary-100 to-primary-50 rounded-full">
                                        <svg className="w-16 h-16 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h3 className="font-heading font-bold text-3xl text-gray-900 mb-3 text-center">
                                        {activeFilterCount > 0 ? 'No Projects Found' : 'Coming Soon'}
                                    </h3>
                                    <p className="text-gray-600 text-center max-w-md mb-6">
                                        {activeFilterCount > 0
                                            ? "Try adjusting your filters to see more projects."
                                            : "We're working on bringing you the latest new property launches in Malaysia. This feature will be available soon!"}
                                    </p>
                                    {activeFilterCount > 0 && (
                                        <button onClick={resetFilters} className="btn-primary">
                                            Clear All Filters
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {projects.map((project) => (
                                        <ProjectCard key={project.id} property={project} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && projects.length > 0 && (
                        <div className="mt-8 flex justify-center">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => loadProjects(page)}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Filter Modal */}
            <FilterModal
                isOpen={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                filters={filters}
                filterOptions={filterOptions || {
                    propertyTypes: [],
                    locations: [],
                    bedrooms: [],
                    priceRange: { min: 0, max: 10000000 }
                }}
                onApply={(newFilters) => {
                    const safeFilters = {
                        ...newFilters,
                        tenure: newFilters.tenure || ''
                    }
                    setFilters(safeFilters)
                    setFilterModalOpen(false)
                    loadProjects(1, true, safeFilters)
                    syncFiltersToUrl(safeFilters)
                }}
                onReset={() => {
                    const resetState = {
                        propertyType: '',
                        minPrice: '',
                        maxPrice: '',
                        bedrooms: '',
                        state: '',
                        tenure: '',
                        location: ''
                    }
                    setFilters(resetState)
                    loadProjects(1, true, resetState)
                    syncFiltersToUrl(resetState)
                }}
            />



            <Footer />
        </>
    )
}
