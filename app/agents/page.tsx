'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Pagination from '@/components/Pagination'
import { getAgentsPaginated } from '@/lib/database'
import { mockAgents } from '@/lib/mockData'
import { Agent } from '@/lib/supabase'

const AGENTS_PER_PAGE = 12

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [searchQuery, setSearchQuery] = useState('')
    const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])

    useEffect(() => {
        loadAgents(1)
    }, [])

    // Filter agents based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredAgents(agents)
        } else {
            const query = searchQuery.toLowerCase()
            const filtered = agents.filter(agent =>
                agent.name.toLowerCase().includes(query) ||
                (agent.agency && agent.agency.toLowerCase().includes(query))
            )
            setFilteredAgents(filtered)
        }
    }, [searchQuery, agents])

    async function loadAgents(page: number) {
        try {
            setLoading(true)

            const result = await getAgentsPaginated(page, AGENTS_PER_PAGE)

            if (result.totalCount > 0) {
                setAgents(result.agents)
                setFilteredAgents(result.agents)
                setTotalCount(result.totalCount)
                setCurrentPage(page)
            } else if (page === 1) {
                // Fallback to mock data if no agents in database
                setAgents(mockAgents)
                setFilteredAgents(mockAgents)
                setTotalCount(mockAgents.length)
            }
        } catch (error) {
            console.error('Error loading agents:', error)
            if (page === 1) {
                setAgents(mockAgents)
                setFilteredAgents(mockAgents)
                setTotalCount(mockAgents.length)
            }
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (page: number) => {
        loadAgents(page)
        setSearchQuery('')
        // Scroll to top of results
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
                            Find Property Agents in Malaysia
                        </h1>
                        <p className="text-white/80 text-lg mb-8">
                            Search by state, specialty, name, and agency to find real estate agent details, photo, and property listings.
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

                        {/* Quick Stats */}
                        <div className="mt-8 flex justify-center gap-8 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{totalCount.toLocaleString()}</div>
                                <div className="text-white/70">Property Agents</div>
                            </div>
                            <div className="w-px bg-white/20"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">24/7</div>
                                <div className="text-white/70">Support Available</div>
                            </div>
                            <div className="w-px bg-white/20"></div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">Trusted</div>
                                <div className="text-white/70">Verified Agents</div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0"></div>
                                        <div className="flex-1">
                                            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                    <div className="mt-6 h-10 bg-gray-200 rounded-lg"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Agents Grid - PropertyGuru Style */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    className="agent-card bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 group"
                                >
                                    <div className="p-5">
                                        {/* Agent Header */}
                                        <div className="flex items-start gap-4">
                                            {/* Photo */}
                                            <div className="relative flex-shrink-0">
                                                {agent.photo_url ? (
                                                    <img
                                                        src={agent.photo_url}
                                                        alt={agent.name}
                                                        className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold text-xl ring-2 ring-gray-100 ${agent.photo_url ? 'hidden' : ''}`}>
                                                    {agent.name.charAt(0).toUpperCase()}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                                                    {agent.name}
                                                </h3>
                                                {agent.agency && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate" title={agent.agency}>
                                                        {agent.agency}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="flex items-center text-sm text-gray-600 mb-2">
                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="truncate">{agent.phone || 'Not available'}</span>
                                            </div>

                                            {agent.email && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className="truncate">{agent.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-4 flex gap-2">
                                            {agent.whatsapp_link ? (
                                                <a
                                                    href={agent.whatsapp_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                    </svg>
                                                    WhatsApp
                                                </a>
                                            ) : (
                                                <a
                                                    href={agent.phone ? `tel:${agent.phone}` : '#'}
                                                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    Call
                                                </a>
                                            )}
                                            <button className="px-4 py-2.5 border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

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
        </div>
    )
}
