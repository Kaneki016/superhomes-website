'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { notFound, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import PropertyDescription from '@/components/PropertyDescription'
import ImageGallery from '@/components/ImageGallery'
import SinglePropertyMap from '@/components/SinglePropertyMap'
import { getPropertyById, getAgentByAgentId, getSimilarProperties } from '@/lib/database'
import { getPropertyById as getMockPropertyById, getAgentById as getMockAgentById, mockProperties } from '@/lib/mockData'
import { Property, Agent } from '@/lib/supabase'
import { useFavorites } from '@/contexts/FavoritesContext'
import ShareButton from '@/components/ShareButton'

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const { isFavorite, toggleFavorite } = useFavorites()
    const [property, setProperty] = useState<Property | null>(null)
    const [agent, setAgent] = useState<Agent | null>(null)
    const [similarProperties, setSimilarProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [notFoundState, setNotFoundState] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                // Try to get from database first
                let propertyData = await getPropertyById(id)
                let agentData: Agent | null = null
                let similar: Property[] = []

                if (propertyData) {
                    // Got from database
                    agentData = await getAgentByAgentId(propertyData.agent_id)
                    similar = await getSimilarProperties(id, propertyData.property_type)
                } else {
                    // Fallback to mock data
                    const mockProperty = getMockPropertyById(id)
                    if (mockProperty) {
                        propertyData = mockProperty
                        agentData = getMockAgentById(mockProperty.agent_id) || null
                        similar = mockProperties
                            .filter(p => p.id !== id && p.property_type === mockProperty.property_type)
                            .slice(0, 3)
                    }
                }

                if (!propertyData) {
                    setNotFoundState(true)
                    return
                }

                setProperty(propertyData)
                setAgent(agentData)
                setSimilarProperties(similar)
            } catch (error) {
                console.error('Error loading property:', error)
                // Try mock data on error
                const mockProperty = getMockPropertyById(id)
                if (mockProperty) {
                    setProperty(mockProperty)
                    setAgent(getMockAgentById(mockProperty.agent_id) || null)
                    setSimilarProperties(mockProperties
                        .filter(p => p.id !== id && p.property_type === mockProperty.property_type)
                        .slice(0, 3))
                } else {
                    setNotFoundState(true)
                }
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id])

    if (notFoundState) {
        notFound()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-8">
                    <div className="animate-pulse">
                        <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <div className="bg-gray-200 rounded-2xl h-96 mb-6"></div>
                                <div className="glass p-8 rounded-2xl">
                                    <div className="h-8 w-32 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-12 w-3/4 bg-gray-200 rounded mb-4"></div>
                                    <div className="h-6 w-48 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                            <div className="lg:col-span-1">
                                <div className="glass p-6 rounded-2xl h-64 bg-gray-200"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    if (!property) {
        return null
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(price)
    }

    const handleWhatsApp = () => {
        if (!agent || !agent.phone) return
        const phoneNumber = agent.phone.replace(/[^0-9]/g, '')

        // Get the full property URL
        const propertyUrl = typeof window !== 'undefined' ? window.location.href : ''

        // Get the property image URL
        const propertyImage = property.main_image_url || property.images[0] || ''

        // Build a comprehensive message with property details
        // Using WhatsApp markdown (*bold*) for better formatting
        // IMPORTANT: Put the property URL FIRST so WhatsApp generates the OG preview
        const propertyDetails = [
            propertyUrl,
            ``,
            `Hi, I am interested in:`,
            `*${property.property_name}*`,
            `${property.bedrooms > 0 ? property.bedrooms + ' Beds / ' : ''}${formatPrice(property.price)}`,
            ``,
            `Can you provide more information?`
        ].filter(Boolean).join('\n')

        const message = encodeURIComponent(propertyDetails)
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    }

    const handleCall = () => {
        if (!agent || !agent.phone) return
        window.location.href = `tel:${agent.phone}`
    }

    return (
        <>
            <Head>
                <title>{property.property_name} - SuperHomes</title>
                <meta name="description" content={`${property.property_name} - ${formatPrice(property.price)} | ${property.bedrooms > 0 ? `${property.bedrooms} bed, ` : ''}${property.bathrooms} bath, ${property.size}`} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${property.property_name} - ${formatPrice(property.price)}`} />
                <meta property="og:description" content={`${property.property_type} | ${property.bedrooms > 0 ? `${property.bedrooms} bed, ` : ''}${property.bathrooms} bath, ${property.size} | ${property.state || property.address}`} />
                <meta property="og:image" content={property.main_image_url || property.images[0] || '/og-default.jpg'} />
                <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${property.property_name} - ${formatPrice(property.price)}`} />
                <meta name="twitter:description" content={`${property.property_type} | ${property.bedrooms > 0 ? `${property.bedrooms} bed, ` : ''}${property.bathrooms} bath, ${property.size}`} />
                <meta name="twitter:image" content={property.main_image_url || property.images[0] || '/og-default.jpg'} />
            </Head>

            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="container-custom py-8">
                    {/* Back Button */}
                    <button
                        onClick={() => window.history.back()}
                        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Back</span>
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            {/* PropertyGuru-Style Image Gallery */}
                            <ImageGallery images={property.images} propertyName={property.property_name} mainImage={property.main_image_url} />

                            {/* Property Info */}
                            <div className="glass p-8 rounded-2xl mb-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="inline-block bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                                                    {property.property_type}
                                                </span>
                                                <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">{property.property_name}</h1>
                                            </div>
                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                {/* Share Button */}
                                                <ShareButton
                                                    url={typeof window !== 'undefined' ? window.location.href : ''}
                                                    title={`Check out ${property.property_name}`}
                                                    className="p-3 border-0 shadow-sm"
                                                />
                                                {/* Favorite Button */}
                                                <button
                                                    onClick={() => toggleFavorite(property.id)}
                                                    className="p-3 rounded-full hover:bg-gray-100 transition-colors group"
                                                    title={isFavorite(property.id) ? 'Remove from favorites' : 'Add to favorites'}
                                                >
                                                    {isFavorite(property.id) ? (
                                                        <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-7 h-7 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            </svg>
                                            <span>{property.address}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                            {formatPrice(property.price)}
                                        </p>
                                    </div>
                                </div>

                                {/* Property Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
                                    {property.bedrooms > 0 && (
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                                            <p className="text-sm text-gray-600">Bedrooms</p>
                                        </div>
                                    )}
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                                        <p className="text-sm text-gray-600">Bathrooms</p>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900">{property.size}</p>
                                        <p className="text-sm text-gray-600">Size</p>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                                        <p className="text-lg font-bold text-gray-900">{property.tenure}</p>
                                        <p className="text-sm text-gray-600">Tenure</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="mb-6">
                                    <h2 className="font-heading font-bold text-xl mb-3">Description</h2>
                                    <PropertyDescription text={property.description || ''} />
                                </div>

                                {/* Key Features & Facilities */}
                                {property.facilities && (property.facilities.amenities?.length > 0 || property.facilities.common_facilities?.length > 0) && (
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        <h2 className="font-heading font-bold text-xl mb-4">Key Features & Facilities</h2>

                                        {/* Amenities */}
                                        {property.facilities.amenities && property.facilities.amenities.length > 0 && (
                                            <div className="mb-4">
                                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Amenities</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {property.facilities.amenities.map((amenity, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            {amenity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Common Facilities */}
                                        {property.facilities.common_facilities && property.facilities.common_facilities.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Common Facilities</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {property.facilities.common_facilities.map((facility, index) => (
                                                        <span
                                                            key={index}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            {facility}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Specifications */}
                                <div>
                                    <h2 className="font-heading font-bold text-xl mb-3">Specifications</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex justify-between py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Property Type</span>
                                            <span className="font-semibold text-gray-900">{property.property_type}</span>
                                        </div>
                                        {property.furnishing && (
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Furnishing</span>
                                                <span className="font-semibold text-gray-900">{property.furnishing}</span>
                                            </div>
                                        )}
                                        {property.size && (
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Built-up Size</span>
                                                <span className="font-semibold text-gray-900">{property.size}</span>
                                            </div>
                                        )}
                                        {property.price_per_sqft && (
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Price per sqft</span>
                                                <span className="font-semibold text-gray-900">RM {property.price_per_sqft.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Tenure</span>
                                            <span className="font-semibold text-gray-900">{property.tenure}</span>
                                        </div>
                                        {property.built_year && (
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Built Year</span>
                                                <span className="font-semibold text-gray-900">{property.built_year}</span>
                                            </div>
                                        )}
                                        {property.listed_date && (
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Listed Date</span>
                                                <span className="font-semibold text-gray-900">{property.listed_date}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Location Map */}
                                {property.latitude && property.longitude && property.latitude !== -99 && (
                                    <div className="mb-6">
                                        <h2 className="font-heading font-bold text-xl mb-3">Location</h2>
                                        <SinglePropertyMap
                                            latitude={property.latitude}
                                            longitude={property.longitude}
                                            propertyName={property.property_name}
                                            className="border border-gray-200 shadow-sm"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            📍 {property.address}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Similar Properties */}
                            {similarProperties.length > 0 && (
                                <div>
                                    <h2 className="font-heading font-bold text-2xl mb-6">Similar Properties</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {similarProperties.map((prop) => (
                                            <PropertyCard key={prop.id} property={prop} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="glass p-6 rounded-2xl sticky top-24">
                                {/* Agent Info */}
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <h3 className="font-heading font-semibold text-lg mb-4">Contact Agent</h3>
                                    {agent ? (
                                        <>
                                            <Link href={`/agents/${agent.agent_id}`} className="flex items-center mb-4 group">
                                                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl mr-4 group-hover:ring-2 group-hover:ring-primary-300 transition-all">
                                                    {agent.photo_url ? (
                                                        <img
                                                            src={agent.photo_url}
                                                            alt={agent.name}
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        agent.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors">{agent.name}</p>
                                                    <p className="text-sm text-gray-600">{agent.agency || 'Property Agent'}</p>
                                                </div>
                                            </Link>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    <span>{agent.phone || 'Not available'}</span>
                                                </div>
                                            </div>
                                            <Link
                                                href={`/agents/${agent.agent_id}`}
                                                className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium mt-3"
                                            >
                                                View Agent Profile
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </>
                                    ) : (
                                        <p className="text-gray-600">Agent information not available</p>
                                    )}
                                </div>

                                {/* Contact Buttons */}
                                {agent && (
                                    <div className="space-y-3">
                                        <button onClick={handleWhatsApp} className="btn-primary w-full flex items-center justify-center">
                                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            WhatsApp Agent
                                        </button>
                                        <button onClick={handleCall} className="btn-secondary w-full flex items-center justify-center">
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            Call Agent
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </>
    )
}
