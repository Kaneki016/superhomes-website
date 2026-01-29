'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { getAgentByAgentId, getPropertiesByAgentId } from '@/app/actions/property-actions'
import { Agent, Property } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { cleanBioText } from '@/lib/utils'

const PROPERTIES_PER_PAGE = 12

export default function AgentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const agentId = params.id as string

    const [agent, setAgent] = useState<Agent | null>(null)
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [propertiesLoading, setPropertiesLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [hasMore, setHasMore] = useState(false)

    const [imageError, setImageError] = useState(false)

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
                {/* Loading state with dark header skeleton */}
                <div className="bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="container-custom py-12">
                        <div className="flex flex-col lg:flex-row gap-8 items-start">
                            <div className="w-40 h-40 rounded-full bg-gray-700 animate-pulse"></div>
                            <div className="flex-1 space-y-4">
                                <div className="h-8 bg-gray-700 rounded w-1/3 animate-pulse"></div>
                                <div className="h-4 bg-gray-700 rounded w-1/4 animate-pulse"></div>
                                <div className="h-20 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="container-custom py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
                        ))}
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
                        <Link href="/agents" className="text-primary-600 font-semibold hover:text-primary-700">
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

            {/* IQI-Style Dark Header Section */}
            <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
                <div className="container-custom py-10 md:py-14">
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        {/* Agent Photo */}
                        <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border-4 border-gray-700 shadow-2xl flex-shrink-0">
                            {agent.photo_url && !imageError && !agent.photo_url.includes('nophoto_agent') ? (
                                <Image
                                    src={agent.photo_url}
                                    alt={agent.name}
                                    fill
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-6xl font-bold">
                                    {agent.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 text-white">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2">
                                {agent.name}
                            </h1>
                            {agent.agency && (
                                <p className="text-gray-400 text-lg mb-2">
                                    {agent.agency}
                                </p>
                            )}

                            {agent.ren_number && (
                                <div className="mb-4">
                                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold border border-green-500/30">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        REN {agent.ren_number}
                                    </span>
                                </div>
                            )}

                            {/* Agent Bio */}
                            <p className="text-gray-300 text-sm leading-relaxed max-w-2xl whitespace-pre-line">
                                {cleanBioText(agent.bio) || 'Professional property agent with expertise in residential and commercial properties. Dedicated to helping clients find their perfect property with personalized service and market insights.'}
                            </p>
                        </div>

                        {/* Action Buttons - Right Side */}
                        <div className="flex flex-col gap-3 w-full lg:w-auto lg:min-w-[200px]">
                            {agent.phone && (
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
                                            return
                                        }
                                        window.location.href = `tel:${agent.phone}`
                                    }}
                                    className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:translate-x-1 group w-full lg:w-auto"
                                >
                                    <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                    </span>
                                    <span className="flex-1 text-left">Call Agent</span>
                                    <svg className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            )}
                            {agent.phone && (
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
                                            return
                                        }
                                        if (agent.phone) {
                                            window.open(`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`, '_blank')
                                        }
                                    }}
                                    className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:translate-x-1 group w-full lg:w-auto"
                                >
                                    <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                    </span>
                                    <span className="flex-1 text-left">WhatsApp</span>
                                    <svg className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            )}
                            {agent.email && (
                                <a
                                    href={`mailto:${agent.email}`}
                                    className="flex items-center gap-3 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:translate-x-1 group w-full lg:w-auto"
                                >
                                    <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </span>
                                    <span className="flex-1">Email</span>
                                    <svg className="w-5 h-5 opacity-60 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </a>
                            )}
                            <button
                                className="flex items-center gap-3 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3.5 rounded-xl font-semibold transition-all hover:translate-x-1 group w-full lg:w-auto"
                                onClick={() => {
                                    if (!user) {
                                        router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
                                        return
                                    }
                                    // Create vCard for download
                                    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${agent.name}
TEL:${agent.phone || ''}
EMAIL:${agent.email || ''}
ORG:${agent.agency || 'SuperHomes'}
END:VCARD`
                                    const blob = new Blob([vcard], { type: 'text/vcard' })
                                    const url = URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `${agent.name.replace(/\s+/g, '_')}.vcf`
                                    a.click()
                                }}
                            >
                                <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <span className="flex-1 text-left">Save Contact</span>
                                <svg className="w-5 h-5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Agent's Properties - IQI Style Grid */}
            <div className="container-custom py-10">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Properties
                    </h2>
                    <span className="text-gray-500 text-sm">
                        {totalCount} {totalCount === 1 ? 'listing' : 'listings'}
                    </span>
                </div>

                {propertiesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                                <div className="h-60 bg-gray-200"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
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
                                                ? 'bg-primary-600 text-white'
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

                        {/* More Listings Button */}
                        {hasMore && (
                            <div className="text-center mt-8">
                                <Link
                                    href="/properties"
                                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
                                >
                                    More Listings
                                </Link>
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
