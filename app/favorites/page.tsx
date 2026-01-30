'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoritesContext'
import { Property } from '@/lib/supabase'
import { getFavoriteProperties } from '@/app/actions/favorites'

export default function FavoritesPage() {
    const { user, loading: authLoading } = useAuth()
    const { favorites, loading: favoritesLoading } = useFavorites()
    const router = useRouter()
    const [properties, setProperties] = useState<Property[]>([])
    const [loadingProperties, setLoadingProperties] = useState(true)

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login')
        }
    }, [user, authLoading, router])

    // Fetch favorite properties when favorites change
    useEffect(() => {
        const fetchProperties = async () => {
            // Don't do anything if still loading auth or favorites
            if (authLoading || favoritesLoading) {
                return
            }

            // If no user, clear properties
            if (!user) {
                setProperties([])
                setLoadingProperties(false)
                return
            }

            // If favorites context loaded but no favorites, show empty
            if (favorites.length === 0) {
                setProperties([])
                setLoadingProperties(false)
                return
            }

            // Fetch properties for the favorited IDs using Server Action
            setLoadingProperties(true)
            try {
                const data = await getFavoriteProperties()
                // Cast to Property[] (Assuming server action returns compatible shape)
                setProperties(data as unknown as Property[])
            } catch (error) {
                console.error('Error fetching favorite properties:', error)
                setProperties([])
            } finally {
                setLoadingProperties(false)
            }
        }

        fetchProperties()
    }, [user, favorites, favoritesLoading, authLoading])

    // Show loading state
    if (authLoading || favoritesLoading) {
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

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="font-heading font-bold text-3xl text-gray-900">
                        Saved Properties
                    </h1>
                    {properties.length > 0 && (
                        <p className="text-gray-600">
                            {properties.length} {properties.length === 1 ? 'property' : 'properties'} saved
                        </p>
                    )}
                </div>

                {loadingProperties ? (
                    // Loading skeleton
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass rounded-2xl overflow-hidden animate-pulse">
                                <div className="h-64 bg-gray-200"></div>
                                <div className="p-5 space-y-4">
                                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : properties.length === 0 ? (
                    // Empty State
                    <div className="glass p-12 rounded-2xl text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-12 h-12 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="font-heading font-semibold text-xl text-gray-900 mb-2">
                            No saved properties yet
                        </h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            When you find properties you like, click the heart icon to save them here for easy access later.
                        </p>
                        <Link href="/properties" className="btn-primary inline-block">
                            Browse Properties
                        </Link>
                    </div>
                ) : (
                    // Property Grid
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}

                {/* Tip Section */}
                {properties.length > 0 && (
                    <div className="mt-12 glass p-6 rounded-2xl">
                        <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Pro Tip</h3>
                                <p className="text-gray-600 text-sm">
                                    Click on a property card to view more details and contact the agent directly.
                                    You can remove a property from your favorites by clicking the heart icon again.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}
