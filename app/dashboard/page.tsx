'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Property } from '@/lib/supabase'

export default function DashboardPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalProperties: 0,
        totalViews: 0,
        totalContacts: 0,
    })

    // Redirect if not logged in or not an agent
    useEffect(() => {
        if (!authLoading && (!user || profile?.user_type !== 'agent')) {
            router.push('/login')
        }
    }, [user, profile, authLoading, router])

    // Fetch agent's properties
    useEffect(() => {
        async function fetchAgentProperties() {
            if (!profile || profile.user_type !== 'agent') return

            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('agent_id', profile.agent_id)
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error fetching properties:', error)
                    setProperties([])
                } else {
                    setProperties(data || [])
                    setStats(prev => ({
                        ...prev,
                        totalProperties: data?.length || 0
                    }))
                }
            } catch (error) {
                console.error('Error:', error)
                setProperties([])
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading && profile) {
            fetchAgentProperties()
        }
    }, [profile, authLoading])

    if (authLoading || (user && !profile)) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-12">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!user || profile?.user_type !== 'agent') {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-12">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">Agent Dashboard</h1>
                    <p className="text-gray-600">Manage your properties and track your performance</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">Total Properties</p>
                                <p className="font-heading font-bold text-3xl text-gray-900">{stats.totalProperties}</p>
                            </div>
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">Total Views</p>
                                <p className="font-heading font-bold text-3xl text-gray-900">{stats.totalViews}</p>
                                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                            </div>
                            <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-sm mb-1">Inquiries</p>
                                <p className="font-heading font-bold text-3xl text-gray-900">{stats.totalContacts}</p>
                                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Properties Section */}
                <div className="glass p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-heading font-bold text-xl text-gray-900">Your Properties</h2>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-64 bg-gray-200 rounded-xl mb-4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>
                    ) : properties.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <h3 className="font-semibold text-gray-900 mb-2">No Properties Yet</h3>
                            <p className="text-gray-600 mb-6">Your property listings will appear here once they're added to the system.</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    )
}
