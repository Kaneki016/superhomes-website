'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Pagination from '@/components/Pagination'
import PropertyCard from '@/components/PropertyCard'
import { ListSkeleton } from '@/components/SkeletonLoader'
import { getAgentsPaginated, getPropertiesByAgentIds, searchAgents } from '@/lib/database'
import { Agent, Property } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const AGENTS_PER_PAGE = 12

// Malaysian states for filter dropdown
const MALAYSIAN_STATES = [
    'Johor',
    'Kedah',
    'Kelantan',
    'Kuala Lumpur',
    'Labuan',
    'Melaka',
    'Negeri Sembilan',
    'Pahang',
    'Penang',
    'Perak',
    'Perlis',
    'Putrajaya',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Terengganu'
]

// Loading fallback for Suspense
function AgentsPageLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-12 md:py-16">
                <div className="container-custom text-center">
                    <div className="h-12 bg-white/20 rounded w-96 mx-auto mb-4 animate-pulse"></div>
                    <div className="h-6 bg-white/10 rounded w-64 mx-auto animate-pulse"></div>
                </div>
            </div>
            <div className="container-custom py-8">
                <ListSkeleton count={8} type="agent" />
            </div>
            <Footer />
        </div>
    )
}

// Main page wrapper with Suspense
export default function AgentsPage() {
    return (
        <Suspense fallback={<AgentsPageLoading />}>
            <AgentsPageContent />
        </Suspense>
    )
}

function AgentsPageContent() {
    const { user } = useAuth()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    // Get initial page from URL or default to 1
    const initialPage = parseInt(searchParams.get('page') || '1', 10)
    const [currentPage, setCurrentPage] = useState(initialPage)
    const [totalCount, setTotalCount] = useState(0)
    // Initialize search query directly from URL params
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [selectedState, setSelectedState] = useState(searchParams.get('state') || '')
    const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
    const [agentProperties, setAgentProperties] = useState<Property[]>([])
    const [loadingProperties, setLoadingProperties] = useState(false)

    useEffect(() => {
        loadAgents(initialPage, searchParams.get('state') || '')
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // Only run on mount - initialPage is intentionally omitted to prevent refetch on page change

    // Search agents in database when query changes
    useEffect(() => {
        async function searchAgentsInDatabase() {
            if (searchQuery.trim() === '') {
                // No search query - show paginated agents from loadAgents
                setFilteredAgents(agents)
                setAgentProperties([])
            } else if (searchQuery.trim().length >= 2) {
                // Search for agents in the database
                setLoadingProperties(true)
                try {
                    const results = await searchAgents(searchQuery, 20) // Get up to 20 matching agents
                    setFilteredAgents(results)

                    // Also fetch their properties
                    if (results.length > 0) {
                        const agentIds = results.map(a => a.id || a.agent_id).filter((id): id is string => !!id)
                        const props = await getPropertiesByAgentIds(agentIds, 12)
                        setAgentProperties(props)
                    } else {
                        setAgentProperties([])
                    }
                } catch (error) {
                    console.error('Error searching agents:', error)
                    // Fallback to local filtering
                    const query = searchQuery.toLowerCase()
                    const filtered = agents.filter(agent =>
                        agent.name.toLowerCase().includes(query) ||
                        (agent.agency && agent.agency.toLowerCase().includes(query))
                    )
                    setFilteredAgents(filtered)
                    setAgentProperties([])
                } finally {
                    setLoadingProperties(false)
                }
            } else {
                // Query too short - filter locally
                const query = searchQuery.toLowerCase()
                const filtered = agents.filter(agent =>
                    agent.name.toLowerCase().includes(query) ||
                    (agent.agency && agent.agency.toLowerCase().includes(query))
                )
                setFilteredAgents(filtered)
                setAgentProperties([])
            }
        }

        // Debounce the search
        const timeoutId = setTimeout(searchAgentsInDatabase, 300)
        return () => clearTimeout(timeoutId)
    }, [searchQuery, agents])

    async function loadAgents(page: number, state?: string) {
        try {
            setLoading(true)

            const result = await getAgentsPaginated(page, AGENTS_PER_PAGE, state || undefined)

            setAgents(result.agents)
            setFilteredAgents(result.agents)
            setTotalCount(result.totalCount)
            setCurrentPage(page)
        } catch (error) {
            console.error('Error loading agents:', error)
            setAgents([])
            setFilteredAgents([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (page: number) => {
        // Update URL with the new page number and state
        const params = new URLSearchParams()
        if (page > 1) {
            params.set('page', page.toString())
        }
        if (selectedState) {
            params.set('state', selectedState)
        }
        const queryString = params.toString()
        router.push(`/agents${queryString ? `?${queryString}` : ''}`, { scroll: false })

        loadAgents(page, selectedState)
        setSearchQuery('')
        // Scroll to top of results
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleStateChange = (state: string) => {
        setSelectedState(state)

        // Update URL
        const params = new URLSearchParams()
        if (state) {
            params.set('state', state)
        }
        const queryString = params.toString()
        router.push(`/agents${queryString ? `?${queryString}` : ''}`, { scroll: false })

        // Reload agents with new state filter
        loadAgents(1, state)
        setSearchQuery('')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const totalPages = Math.ceil(totalCount / AGENTS_PER_PAGE)

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Hero Section - PropertyGuru Style */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
                <div className="container-custom py-12 md:py-16">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4">
                            {selectedState ? `Top Property Agents in ${selectedState}` : 'Top Property Agents in Malaysia'}
                        </h1>
                        <p className="text-white/80 text-lg mb-8">
                            {selectedState
                                ? `Ranked by active listings in ${selectedState}`
                                : 'All agents ranked by performance (priority states first)'
                            }
                        </p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <div className="flex bg-white rounded-xl overflow-hidden shadow-xl">
                                <div className="flex-1 relative">
                                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    <input
                                        type="text"
                                        placeholder="Search by agent name or agency..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 text-gray-800 placeholder-gray-400 focus:outline-none"
                                    />
                                </div>
                                <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 font-medium transition-colors flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* State Filter Dropdown - Enhanced Design */}
                        <div className="mt-6 max-w-md mx-auto">
                            <div className="relative group">
                                {/* Location Icon */}
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                                    <svg className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>

                                {/* Dropdown */}
                                <select
                                    value={selectedState}
                                    onChange={(e) => handleStateChange(e.target.value)}
                                    className="w-full pl-12 pr-10 py-4 rounded-xl bg-white/10 backdrop-blur-md border-2 border-white/30 text-white font-medium text-base focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 cursor-pointer appearance-none shadow-lg hover:bg-white/15 hover:border-white/40"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white' opacity='0.8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 1rem center',
                                        backgroundSize: '1.25rem'
                                    }}
                                >
                                    <option value="" className="bg-gray-900 text-white font-semibold py-3">
                                        All States
                                    </option>
                                    <option disabled className="bg-gray-800 text-gray-500 text-xs py-1 font-normal">
                                        ── Select a specific state ──
                                    </option>
                                    {MALAYSIAN_STATES.map((state) => (
                                        <option key={state} value={state} className="bg-gray-900 text-white py-3">
                                            {state}
                                        </option>
                                    ))}
                                </select>

                                {/* Subtle glow effect */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400/0 via-primary-500/20 to-primary-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10 blur-xl"></div>
                            </div>

                            {/* Helper text */}
                            <p className="text-white/60 text-sm text-center mt-3 font-medium">
                                {selectedState ? `Showing top agents in ${selectedState}` : 'Showing all agents (priority states first)'}
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-8 flex justify-center gap-8 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{loading ? '...' : totalCount.toLocaleString()}</div>
                                <div className="text-white/70">Property Agents</div>
                            </div>
                            <div className="w-px bg-white/20"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">24/7</div>
                                <div className="text-white/70">Support Available</div>
                            </div>
                            <div className="w-px bg-white/20"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">Verified</div>
                                <div className="text-white/70">Trusted Agents</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container-custom py-8">
                {/* Results Count */}
                {!loading && totalCount > 0 && (
                    <div className="flex items-center justify-between mb-6">
                        <div className="text-gray-600">
                            <span className="font-semibold text-gray-900">{searchQuery ? filteredAgents.length : totalCount.toLocaleString()}</span> agents found
                            {totalPages > 1 && !searchQuery && (
                                <span className="text-gray-500"> • Page {currentPage} of {totalPages}</span>
                            )}
                        </div>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <ListSkeleton count={12} type="agent" />
                ) : (
                    <>
                        {/* Agents Grid - PropertyGuru Style */}
                        {/* Agents Grid - Modern Dashboard Style */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-primary-100 transition-all duration-300 flex flex-col sm:flex-row gap-5 items-center group"
                                >
                                    {/* Profile Section */}
                                    <div className="flex flex-col items-center md:items-center md:w-1/3 shrink-0 relative">
                                        <div className="relative">
                                            {/* Photo */}
                                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md ring-1 ring-gray-100 group-hover:scale-105 transition-transform duration-300">
                                                {agent.photo_url ? (
                                                    <img
                                                        src={agent.photo_url}
                                                        alt={agent.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-3xl ${agent.photo_url ? 'hidden' : ''}`}>
                                                    {agent.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>
                                            {/* Active Dot */}
                                            <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" title="Active"></div>
                                        </div>

                                        <div className="mt-4 text-center">
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight group-hover:text-primary-600 transition-colors">
                                                {agent.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-1">{agent.agency || 'Independent Agent'}</p>
                                            {agent.agency_reg_no && (
                                                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 bg-gray-50 text-gray-400 border border-gray-200 rounded-full font-medium tracking-wide">
                                                    {agent.agency_reg_no}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Divider (Hidden on mobile, Visible on desktop) */}
                                    <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
                                    <div className="block md:hidden w-full h-px bg-gray-100"></div>

                                    {/* Stats & Action Section */}
                                    <div className="flex-1 w-full flex flex-col justify-center">
                                        <div className="grid grid-cols-2 gap-3 mb-5">
                                            <div className="bg-blue-50 rounded-xl p-3 text-center transition-colors hover:bg-blue-100 flex flex-col justify-center h-20">
                                                {agent.listings_for_rent_count ? (
                                                    <span className="block text-2xl font-bold text-blue-600">{agent.listings_for_rent_count}</span>
                                                ) : (
                                                    <span className="block text-xs font-bold text-blue-600 mb-1">No active listings</span>
                                                )}
                                                <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">For Rent</span>
                                            </div>
                                            <div className="bg-emerald-50 rounded-xl p-3 text-center transition-colors hover:bg-emerald-100 flex flex-col justify-center h-20">
                                                {agent.listings_for_sale_count ? (
                                                    <span className="block text-2xl font-bold text-emerald-600">{agent.listings_for_sale_count}</span>
                                                ) : (
                                                    <span className="block text-xs font-bold text-emerald-600 mb-1">No active listings</span>
                                                )}
                                                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">For Sale</span>
                                            </div>
                                        </div>

                                        <Link
                                            href={`/agents/${agent.id || agent.agent_id}`}
                                            className="block w-full text-center py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition-all active:scale-[0.98]"
                                        >
                                            View Full Profile
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Agent Properties Section - Shows when searching */}
                        {searchQuery && (agentProperties.length > 0 || loadingProperties) && (
                            <div className="mt-10">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Properties from {filteredAgents.length === 1 ? filteredAgents[0].name : 'Matching Agents'} ({agentProperties.length})
                                    </h2>
                                    <Link href={`/properties?search=${encodeURIComponent(searchQuery)}`} className="text-primary-600 text-sm font-medium hover:text-primary-700">
                                        View All Properties →
                                    </Link>
                                </div>

                                {loadingProperties ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="bg-white rounded-xl h-96 animate-pulse">
                                                <div className="h-56 bg-gray-200 rounded-t-xl"></div>
                                                <div className="p-4 space-y-3">
                                                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {agentProperties.map((property) => (
                                            <PropertyCard key={property.id} property={property} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && !searchQuery && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        )}

                        {/* Empty State */}
                        {filteredAgents.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-semibold text-xl text-gray-900 mb-2">
                                    {searchQuery ? 'No agents found' : 'No agents available'}
                                </h3>
                                <p className="text-gray-600">
                                    {searchQuery
                                        ? `No agents match "${searchQuery}". Try a different search term.`
                                        : 'Check back soon for our property agents!'
                                    }
                                </p>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* CTA Section */}
                <div className="mt-16">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center text-white relative overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        </div>

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">
                                Are You a Property Agent?
                            </h2>
                            <p className="text-white/80 mb-6">
                                Join SuperHomes and reach thousands of potential buyers. List your properties and grow your business with us.
                            </p>
                            <a
                                href="/register"
                                className="inline-flex items-center gap-2 bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Register as Agent
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div >
    )
}
