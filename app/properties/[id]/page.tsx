'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import PropertyDescription from '@/components/PropertyDescription'
import { getPropertyById, getAgentById, getSimilarProperties } from '@/lib/database'
import { getPropertyById as getMockPropertyById, getAgentById as getMockAgentById, mockProperties } from '@/lib/mockData'
import { Property, Agent } from '@/lib/supabase'

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
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
                    agentData = await getAgentById(propertyData.agent_id)
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
        if (!agent || !agent.whatsapp_link) return
        const message = encodeURIComponent(`Hi, I'm interested in ${property.property_name} listed at ${formatPrice(property.price)}`)
        // Use the whatsapp_link directly and append our custom message
        const baseUrl = agent.whatsapp_link.split('?')[0]
        window.open(`${baseUrl}?text=${message}`, '_blank')
    }

    const handleCall = () => {
        if (!agent || !agent.phone) return
        window.location.href = `tel:${agent.phone}`
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-8">
                {/* Breadcrumb */}
                <div className="mb-6 text-sm text-gray-600">
                    <Link href="/" className="hover:text-primary-600">Home</Link>
                    <span className="mx-2">/</span>
                    <Link href="/properties" className="hover:text-primary-600">Properties</Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900">{property.property_name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Image Gallery */}
                        <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl h-96 mb-6 flex items-center justify-center relative overflow-hidden">
                            {(property.main_image_url || (property.images && property.images.length > 0)) ? (
                                <img
                                    src={property.main_image_url || property.images[0]}
                                    alt={property.property_name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        // Hide image on error and show placeholder
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            ) : (
                                <svg className="w-32 h-32 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            )}
                            <div className="absolute bottom-4 right-4">
                                <span className="text-white text-sm font-semibold bg-black/30 px-3 py-1 rounded">
                                    SuperHomes
                                </span>
                            </div>
                        </div>

                        {/* Property Info */}
                        <div className="glass p-8 rounded-2xl mb-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <span className="inline-block bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                                        {property.property_type}
                                    </span>
                                    <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">{property.property_name}</h1>
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
                                        <div className="flex items-center mb-4">
                                            <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl mr-4">
                                                {agent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">{agent.name}</p>
                                                <p className="text-sm text-gray-600">Property Agent</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span>{agent.phone || 'Not available'}</span>
                                            </div>
                                        </div>
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
    )
}
