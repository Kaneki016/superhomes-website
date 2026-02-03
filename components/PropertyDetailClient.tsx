'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import PropertyCard from '@/components/PropertyCard'
import PropertyDescription from '@/components/PropertyDescription'
import ImageGallery from '@/components/ImageGallery'
import { Property, Agent, Transaction } from '@/lib/types'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useAuth } from '@/contexts/AuthContext'
import TrendChart from '@/components/TrendChart'
import ShareButton from '@/components/ShareButton'
import MobileContactBar from '@/components/MobileContactBar'
import Breadcrumbs from '@/components/Breadcrumbs'
import { formatPrice } from '@/lib/utils'

// Lazy load heavy components
const SinglePropertyMap = dynamic(() => import('@/components/SinglePropertyMap'), {
    loading: () => <div className="h-64 bg-gray-100 rounded-xl animate-pulse flex items-center justify-center"><span className="text-gray-400">Loading map...</span></div>,
    ssr: false
})

const NearbyAmenities = dynamic(() => import('@/components/NearbyAmenities'), {
    loading: () => <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />,
    ssr: false
})

const MortgageCalculator = dynamic(() => import('@/components/MortgageCalculator'), {
    loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
})

interface PropertyDetailClientProps {
    property: Property
    agent: Agent | null
    similarProperties: Property[]
    historicalTransactions: Transaction[]
}

export default function PropertyDetailClient({
    property,
    agent,
    similarProperties,
    historicalTransactions
}: PropertyDetailClientProps) {
    const { user } = useAuth()
    const router = useRouter()
    const { isFavorite, toggleFavorite } = useFavorites()
    const [showNumber, setShowNumber] = useState(false)

    // Computed values
    const propertyName = property.title || property.property_name || 'Property'
    const propertySize = property.floor_area_sqft || property.size || ''
    const bedroomCount = property.total_bedrooms || property.bedrooms_num

    const handleWhatsApp = () => {
        if (!user) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }

        if (!agent || !agent.phone) return
        const phoneNumber = agent.phone.replace(/[^0-9]/g, '')

        // Get the full property URL
        const propertyUrl = typeof window !== 'undefined' ? window.location.href : ''

        const propertyDetails = [
            propertyUrl,
            ``,
            `Hi, I am interested in:`,
            `*${propertyName}*`,
            `${bedroomCount && Number(bedroomCount) > 0 ? bedroomCount + ' Beds / ' : ''}${formatPrice(property.price, property.listing_type === 'rent')}`,
            ``,
            `Can you provide more information?`
        ].filter(Boolean).join('\n')

        const message = encodeURIComponent(propertyDetails)
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    }

    const handleCall = () => {
        if (!user) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }

        setShowNumber(true)
        if (showNumber && agent && agent.phone) {
            window.location.href = `tel:${agent.phone}`
        }
    }

    // Generate JSON-LD structured data for SEO
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "name": propertyName,
        "description": property.description || `${propertyName} - ${property.property_type} for ${property.listing_type}`,
        "url": typeof window !== 'undefined' ? window.location.href : '',
        "image": property.main_image_url || property.images?.[0] || '',
        "address": {
            "@type": "PostalAddress",
            "streetAddress": property.address,
            "addressLocality": property.district || property.state,
            "addressRegion": property.state,
            "addressCountry": "MY"
        },
        "geo": property.latitude && property.longitude && property.latitude !== -99 ? {
            "@type": "GeoCoordinates",
            "latitude": property.latitude,
            "longitude": property.longitude
        } : undefined,
        "offers": {
            "@type": "Offer",
            "price": property.price,
            "priceCurrency": "MYR",
            "availability": "https://schema.org/InStock",
            "priceSpecification": {
                "@type": "PriceSpecification",
                "price": property.price,
                "priceCurrency": "MYR"
            }
        },
        "numberOfRooms": bedroomCount || undefined,
        "numberOfBathroomsTotal": property.bathrooms || undefined,
        "floorSize": {
            "@type": "QuantitativeValue",
            "value": propertySize ? parseFloat(propertySize.replace(/[^0-9.]/g, '')) : undefined,
            "unitText": "sqft"
        },
        "datePosted": property.listed_date || property.scraped_at || undefined,
        "agent": agent ? {
            "@type": "RealEstateAgent",
            "name": agent.name,
            "telephone": agent.phone,
            "image": agent.photo_url,
            "url": typeof window !== 'undefined' ? `${window.location.origin}/agents/${agent.id || agent.agent_id}` : ''
        } : undefined
    }

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="container-custom py-8">
                    {/* Back Button */}

                    <button
                        onClick={() => {
                            if (window.history.length > 2) {
                                router.back()
                            } else {
                                // Fallback if no history (e.g. opened in new tab)
                                router.push(property.listing_type === 'rent' ? '/rent' : '/properties')
                            }
                        }}
                        className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="font-medium">Back</span>
                    </button>

                    {/* Breadcrumbs */}
                    <div className="mb-4">
                        <Breadcrumbs items={[
                            { label: property.state || 'Malaysia', href: `/properties?state=${encodeURIComponent(property.state || '')}` },
                            { label: property.listing_type === 'rent' ? 'For Rent' : 'For Sale', href: property.listing_type === 'rent' ? '/rent' : '/properties' },
                            { label: property.property_type || 'Property', href: `/properties?type=${encodeURIComponent(property.property_type || '')}` },
                            { label: propertyName }
                        ]} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2">
                            {/* PropertyGuru-Style Image Gallery */}
                            <ImageGallery images={property.images || []} propertyName={propertyName} mainImage={property.main_image_url} />

                            {/* Property Info */}
                            <div className="glass p-8 rounded-2xl mb-6">
                                {/* Badges Row */}
                                <div className="mb-3">
                                    <span className="inline-block bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-semibold">
                                        {property.property_type || 'Property'}
                                    </span>
                                    {property.listing_type && (
                                        <span className={`inline-block ml-2 px-3 py-1 rounded-full text-sm font-semibold ${property.listing_type === 'sale' ? 'bg-green-100 text-green-600' :
                                            property.listing_type === 'rent' ? 'bg-blue-100 text-blue-600' :
                                                'bg-purple-100 text-purple-600'
                                            }`}>
                                            {property.listing_type === 'sale' ? 'For Sale' :
                                                property.listing_type === 'rent' ? 'For Rent' : 'New Project'}
                                        </span>
                                    )}
                                </div>

                                {/* Title + Price Row - Aligned */}
                                <div className="flex items-start justify-between mb-3">
                                    <h1 className="font-heading font-bold text-3xl text-gray-900">{propertyName}</h1>
                                    <p className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent whitespace-nowrap ml-4">
                                        {formatPrice(property.price, property.listing_type === 'rent')}
                                    </p>
                                </div>

                                {/* Address + Action Buttons Row */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <div className="flex items-center text-gray-600 min-w-0">
                                        <svg className="w-5 h-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        </svg>
                                        <span className="truncate">{property.address}</span>
                                    </div>
                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <ShareButton
                                            url={typeof window !== 'undefined' ? window.location.href : ''}
                                            title={`Check out ${propertyName}`}
                                            className="p-3 border-0 shadow-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                if (!user) {
                                                    router.push('/login')
                                                    return
                                                }
                                                toggleFavorite(property.id)
                                            }}
                                            className="p-4 rounded-full bg-gray-100 hover:bg-red-50 transition-colors group"
                                            title={isFavorite(property.id) ? 'Remove from favorites' : 'Add to favorites'}
                                        >
                                            {isFavorite(property.id) ? (
                                                <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                                </svg>
                                            ) : (
                                                <svg className="w-8 h-8 text-gray-400 group-hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Property Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
                                    {bedroomCount && Number(bedroomCount) > 0 && (
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{bedroomCount}</p>
                                            <p className="text-sm text-gray-600">Bedrooms</p>
                                        </div>
                                    )}
                                    {property.bathrooms && (
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                                            <p className="text-sm text-gray-600">Bathrooms</p>
                                        </div>
                                    )}
                                    {propertySize && (
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-2xl font-bold text-gray-900">{propertySize}</p>
                                            <p className="text-sm text-gray-600">Size</p>
                                        </div>
                                    )}
                                    {property.tenure && (
                                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                                            <p className="text-lg font-bold text-gray-900">{property.tenure}</p>
                                            <p className="text-sm text-gray-600">Tenure</p>
                                        </div>
                                    )}
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
                                        {propertySize && (
                                            <div className="flex justify-between py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Built-up Size</span>
                                                <span className="font-semibold text-gray-900">{propertySize}</span>
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
                                    <div className="mb-6 mt-6">
                                        <h2 className="font-heading font-bold text-xl mb-3">Location</h2>
                                        <SinglePropertyMap
                                            latitude={property.latitude}
                                            longitude={property.longitude}
                                            propertyName={propertyName}
                                            className="border border-gray-200 shadow-sm"
                                        />
                                        <p className="text-sm text-gray-500 mt-2">
                                            📍 {property.address}
                                        </p>
                                    </div>
                                )}

                                {/* Nearby Amenities */}
                                {property.latitude && property.longitude && property.latitude !== -99 && (
                                    <NearbyAmenities
                                        latitude={property.latitude}
                                        longitude={property.longitude}
                                    />
                                )}

                                {/* Market Trends Section */}
                                {historicalTransactions.length > 0 && (
                                    <div className="mb-8 mt-8 border-t border-gray-100 pt-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h2 className="font-heading font-bold text-xl text-gray-900">Market Trends</h2>
                                                <p className="text-sm text-gray-500">Historical transaction trends within 1km radius</p>
                                            </div>
                                        </div>
                                        <div className="h-[400px] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                            <TrendChart transactions={historicalTransactions} className="h-full" />
                                        </div>
                                    </div>
                                )}

                                {/* Mortgage Calculator - Only for Sale/Project properties */}
                                {property.listing_type !== 'rent' && (
                                    <div className="mt-8">
                                        <h2 className="font-heading font-bold text-xl mb-4">Mortgage Calculator</h2>
                                        <MortgageCalculator
                                            propertyPrice={property.price || 0}
                                            isRent={false}
                                        />
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
                                            <div className="flex items-center mb-4 group">
                                                <Link href={`/agents/${agent.id || agent.agent_id}`}>
                                                    <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-2xl mr-4 group-hover:ring-2 group-hover:ring-primary-300 transition-all cursor-pointer">
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
                                                </Link>
                                                <div>
                                                    <Link href={`/agents/${agent.id || agent.agent_id}`}>
                                                        <p className="font-semibold text-gray-900 text-lg group-hover:text-primary-600 transition-colors cursor-pointer">{agent.name}</p>
                                                    </Link>
                                                    <p className="text-sm text-gray-600">{agent.agency || 'Property Agent'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                {showNumber && agent.phone && (
                                                    <div className="flex items-center">
                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                        <span>{agent.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Link
                                                href={`/agents/${agent.id || agent.agent_id}`}
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
                                    <div className="flex flex-col gap-3">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button onClick={handleWhatsApp} className="flex items-center justify-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium text-sm">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                </svg>
                                                WhatsApp
                                            </button>
                                            <button onClick={handleCall} className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors font-medium text-sm ${showNumber ? 'bg-primary-50 border-primary-500 text-primary-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                {showNumber && agent.phone ? 'Call: ' + agent.phone : 'View Phone Number'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>


                        </div>
                    </div>
                </div>

                <Footer />

                {/* Mobile Contact Bar - Only visible on mobile */}
                <MobileContactBar agent={agent} property={property} />
            </div>
        </>
    )
}
