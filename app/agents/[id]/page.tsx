'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { getAgentByAgentId, getPropertiesByAgentId } from '@/lib/database'
import { Agent, Property } from '@/lib/supabase'

const PROPERTIES_PER_PAGE = 12

export default function AgentDetailPage() {
    const params = useParams()
    const agentId = params.id as string

    const [agent, setAgent] = useState<Agent | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [propertiesLoading, setPropertiesLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [hasMore, setHasMore] = useState(false)

    // Load agent details
    useEffect(() => {
        async function loadAgent() {
            if (!agentId) return

            setLoading(true)
            try {
                const agentData = await getAgentByAgentId(agentId)
                setAgent(agentData)
            } catch (error) {
                console.error('Error loading agent:', error)
            } finally {
                setLoading(false)
            }
        }
        loadAgent()
    }, [agentId])


    // Load agent's properties
    const loadProperties = useCallback(async (page: number) => {
        if (!agentId) return

        setPropertiesLoading(true)
        try {
            const result = await getPropertiesByAgentId(agentId, page, PROPERTIES_PER_PAGE)
            setProperties(result.properties)
            setTotalCount(result.totalCount)
            setHasMore(result.hasMore)
            setCurrentPage(page)
        } catch (error) {
            console.error('Error loading properties:', error)
        } finally {
            setPropertiesLoading(false)
        }
    }, [agentId])

    useEffect(() => {
        loadProperties(1)
    }, [loadProperties])

    const totalPages = Math.ceil(totalCount / PROPERTIES_PER_PAGE)

    const handlePageChange = (page: number) => {
        loadProperties(page)
        window.scrollTo({ top: 400, behavior: 'smooth' })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-12">
                    <div className="animate-pulse">
                        <div className="bg-white rounded-2xl p-8 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-4">
                                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!agent) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-12">
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">👤</div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent Not Found</h1>
                        <p className="text-gray-600 mb-6">The agent you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                        <Link href="/agents" className="text-rose-500 font-semibold hover:text-rose-600">
                            ← Back to All Agents
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Back Button */}
            <div className="bg-white border-b border-gray-100">
                <div className="container-custom py-4">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Back</span>
                    </button>
                </div>
            </div>

            {/* Agent Profile Card */}
            <div className="container-custom py-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-8">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {/* Agent Photo */}
                            <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0">
                                {agent.photo_url ? (
                                    <Image
                                        src={agent.photo_url}
                                        alt={agent.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center">
                                        <span className="text-4xl font-bold text-white">
                                            {agent.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Agent Info */}
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                    {agent.name}
                                </h1>
                                {agent.agency && (
                                    <p className="text-gray-600 text-lg mb-4">
                                        <span className="inline-flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            {agent.agency}
                                        </span>
                                    </p>
                                )}

                                {/* Contact Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    {agent.phone && (
                                        <a
                                            href={`tel:${agent.phone}`}
                                            className="inline-flex items-center gap-2 bg-rose-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-rose-600 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Call Agent
                                        </a>
                                    )}
                                    {agent.phone && (
                                        <a
                                            href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            WhatsApp
                                        </a>
                                    )}
                                    {agent.email && (
                                        <a
                                            href={`mailto:${agent.email}`}
                                            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Email
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-rose-500">{totalCount}</div>
                                    <div className="text-gray-600 text-sm">Active Listings</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent's Properties */}
            <div className="container-custom pb-12">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                        Properties by {agent.name}
                    </h2>
                    <span className="text-gray-500">
                        {totalCount} {totalCount === 1 ? 'property' : 'properties'}
                    </span>
                </div>

                {propertiesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <div key={i} className="bg-white rounded-xl h-80 animate-pulse border border-gray-100"></div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-10">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum: number
                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = currentPage - 2 + i
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${currentPage === pageNum
                                                ? 'bg-rose-500 text-white'
                                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="text-5xl mb-4">🏠</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Yet</h3>
                        <p className="text-gray-600">This agent doesn&apos;t have any active property listings at the moment.</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}
