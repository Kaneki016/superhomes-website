'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Property } from '@/lib/supabase'
import { Agent } from '@/lib/supabase'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCompare } from '@/contexts/CompareContext'
import { formatPrice, formatPricePerSqft, getTimeAgo } from '@/lib/utils'
import { generatePropertyUrl } from '@/lib/slugUtils'

interface PropertyCardProps {
    property: Property
    agent?: Agent | null
    variant?: 'grid' | 'list'
}

function PropertyCard({ property, agent: providedAgent, variant = 'grid' }: PropertyCardProps) {
    const [agent, setAgent] = useState<Agent | null>(providedAgent || null)
    // ... existing hooks ...
    const { user } = useAuth()
    const { isFavorite, toggleFavorite } = useFavorites()
    const { isInCompare, addToCompare, removeFromCompare, canAddMore } = useCompare()
    const router = useRouter()
    const [isToggling, setIsToggling] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    // Get agent from contacts if available, otherwise fetch
    useEffect(() => {
        // If agent was provided from parent, use it
        if (providedAgent !== undefined) {
            setAgent(providedAgent)
            return
        }

        // Check if property has contacts embedded
        if (property.contacts && property.contacts.length > 0) {
            // Use the first contact as the agent
            const contact = property.contacts[0]
            setAgent({
                ...contact,
                agent_id: contact.id,
                agency: contact.company_name,
                whatsapp_link: contact.whatsapp_url,
                created_at: contact.scraped_at,
            } as Agent)
            return
        }

        // No fallback fetch - agent info is optional
        // Cards render without agent header if not available
        // This prevents N+1 queries when listing multiple properties
    }, [property.contacts, providedAgent])

    // Get display price based on listing type
    const getDisplayPrice = () => {
        if (property.listing_type === 'rent') {
            const rentPrice = property.rent_details?.monthly_rent || property.price
            return formatPrice(rentPrice, true)
        }
        return formatPrice(property.price, false)
    }

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        console.log('PropertyCard: Favorite button clicked for property:', property.id)
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            console.log('PropertyCard: No user found, redirecting to login')
            router.push('/login')
            return
        }

        if (isToggling) {
            console.log('PropertyCard: Already toggling, ignoring click')
            return
        }

        console.log('PropertyCard: Triggering toggleFavorite')
        setIsToggling(true)
        await toggleFavorite(property.id)
        setIsToggling(false)
        console.log('PropertyCard: ToggleFavorite complete')
    }

    const handleContactClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
            return
        }

        if (agent?.phone) {
            const phoneNumber = agent.phone.replace(/[^0-9]/g, '')
            const propertyImage = property.main_image_url || (property.images && property.images[0]) || ''
            const propertyName = property.title || property.property_name || 'Property'
            const displayPrice = getDisplayPrice()

            const propertyDetails = [
                `*${propertyName}*`,
                ``,
                `*Price:* ${displayPrice}`,
                (property.total_bedrooms || property.bedrooms_num) ? `*Bedrooms:* ${property.total_bedrooms || property.bedrooms_num}` : null,
                property.bathrooms ? `*Bathrooms:* ${property.bathrooms}` : null,
                (property.floor_area_sqft || property.size) ? `*Size:* ${property.floor_area_sqft || property.size}` : null,
                `*Location:* ${property.state || property.address || ''}`,
                property.property_type ? `*Type:* ${property.property_type}` : null,
                property.listing_type ? `*Listing:* For ${property.listing_type === 'sale' ? 'Sale' : property.listing_type === 'rent' ? 'Rent' : 'New Project'}` : null,
                ``,
                `View full details:`,
                `${typeof window !== 'undefined' ? `${window.location.origin}${generatePropertyUrl(property)}` : ''}`,
                ``,
                propertyImage ? `Property Image:` : null,
                propertyImage || null,
                ``,
                `I'm interested in this property. Can you provide more information?`
            ].filter(Boolean).join('\n')

            const message = encodeURIComponent(propertyDetails)
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
        }
    }

    const images = (property.images && property.images.length > 0)
        ? property.images
        : property.main_image_url
            ? [property.main_image_url]
            : []

    const navigateImage = (direction: 'prev' | 'next', e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (direction === 'prev') {
            setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length)
        } else {
            setCurrentImageIndex(prev => (prev + 1) % images.length)
        }
    }

    // Check if property is new (less than 7 days old)
    const isNew = () => {
        const dateToCheck = property.created_at || property.scraped_at
        if (!dateToCheck) return false
        const daysDiff = Math.floor((new Date().getTime() - new Date(dateToCheck).getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 7
    }

    // Get listing type badge style
    const getListingTypeBadge = () => {
        switch (property.listing_type) {
            case 'sale':
                return { text: 'For Sale', className: 'text-emerald-600' }
            case 'rent':
                return { text: 'For Rent', className: 'text-blue-600' }
            case 'project':
                return { text: 'New Project', className: 'text-purple-600' }
            default:
                return null
        }
    }

    const listingBadge = getListingTypeBadge()
    const propertyName = property.title || property.property_name || 'Property'
    const propertySize = property.floor_area_sqft || property.size || ''
    const bedroomCount = property.total_bedrooms || property.bedrooms_num || property.bedrooms
    const favorited = isFavorite(property.id)

    if (variant === 'list') {
        return (
            <div className="property-card-v2 group flex flex-col md:flex-row h-auto md:h-64 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] touch-manipulation">
                {/* Image Section - Left (Desktop) / Top (Mobile) */}
                <div className="w-full md:w-2/5 h-48 md:h-full relative overflow-hidden shrink-0">
                    <Link href={generatePropertyUrl(property)} className="block w-full h-full">
                        {images.length > 0 && !imageError ? (
                            <Image
                                src={images[currentImageIndex]}
                                alt={propertyName}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className={`object-cover group-hover:scale-105 transition-all duration-500 ${!imageLoaded ? 'blur-md scale-110' : 'blur-0 scale-100'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                unoptimized
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                                <svg className="w-12 h-12 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                        )}

                        {/* Badges Overlay */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-2 z-10">
                            {listingBadge && (
                                <span className={`badge-pill ${listingBadge.className} shadow-md font-semibold text-xs`}>
                                    {listingBadge.text}
                                </span>
                            )}
                            {isNew() && (
                                <span className="badge-pill shadow-md font-semibold text-xs text-rose-500">
                                    New
                                </span>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Content Section - Right (Desktop) / Bottom (Mobile) */}
                <div className="flex-1 flex flex-col justify-between p-4 md:p-6 min-w-0">
                    {/* Header: Title, Price, Agent */}
                    <div>
                        <div className="flex justify-between items-start mb-2 gap-4">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 truncate group-hover:text-primary-600 transition-colors" title={propertyName}>
                                    <Link href={generatePropertyUrl(property)}>
                                        {propertyName}
                                    </Link>
                                </h3>
                                <p className="text-gray-500 text-sm truncate">{property.address}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <div className="text-xl md:text-2xl font-bold text-primary-600">{getDisplayPrice()}</div>
                                {property.listing_type === 'sale' && property.price_per_sqft && (
                                    <div className="text-xs text-gray-500">RM {property.price_per_sqft.toFixed(0)} psf</div>
                                )}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="flex items-center gap-4 md:gap-6 text-gray-600 text-sm md:text-base mb-4 flex-wrap">
                            {bedroomCount && Number(bedroomCount) > 0 && (
                                <div className="flex items-center gap-1.5" title="Bedrooms">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="font-medium">{bedroomCount}</span>
                                </div>
                            )}
                            {property.bathrooms && (
                                <div className="flex items-center gap-1.5" title="Bathrooms">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                    </svg>
                                    <span className="font-medium">{property.bathrooms}</span>
                                </div>
                            )}
                            {propertySize && (
                                <div className="flex items-center gap-1.5" title="Build Size">
                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                    <span className="font-medium">{propertySize}</span>
                                </div>
                            )}
                        </div>

                        {/* Description Preview (Desktop Only) */}
                        <p className="hidden md:block text-gray-500 text-sm mb-4">
                            {property.description
                                ? (property.description.length > 150
                                    ? property.description.substring(0, 150) + '...'
                                    : property.description)
                                : 'No description available for this property.'}
                        </p>
                    </div>

                    {/* Footer: Agent & Actions */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        {agent ? (
                            <Link href={`/agents/${agent.id || agent.agent_id}`} className="flex items-center gap-2 group/agent">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                    {agent.photo_url ? (
                                        <Image src={agent.photo_url} alt={agent.name} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-xs font-bold">
                                            {agent.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-gray-900 truncate block max-w-[120px] group-hover/agent:text-primary-600 transition-colors">
                                        {agent.name}
                                    </span>
                                </div>
                            </Link>
                        ) : (
                            <div className="text-sm text-gray-400">Listed by Agent</div>
                        )}

                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isInCompare(property.id)) removeFromCompare(property.id);
                                    else addToCompare(property);
                                }}
                                className={`p-2 rounded-full transition-colors ${isInCompare(property.id) ? 'text-primary-600 bg-primary-50' : 'text-gray-400 hover:text-primary-500 hover:bg-gray-50'}`}
                                title="Compare"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>
                            <button
                                onClick={handleFavoriteClick}
                                disabled={isToggling}
                                className={`p-2 rounded-full transition-colors ${favorited ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                                title="Save"
                            >
                                <svg className="w-5 h-5" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                            <button
                                onClick={handleContactClick}
                                className="ml-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                            >
                                Contact
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="property-card-v2 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] touch-manipulation">
            {/* Agent Header */}
            {agent && (
                <div className="property-card-header">
                    <Link href={`/agents/${agent.id || agent.agent_id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                        <div className="relative property-card-avatar group-hover:ring-2 group-hover:ring-primary-300 transition-all">
                            {agent.photo_url ? (
                                <Image
                                    src={agent.photo_url}
                                    alt={agent.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            ) : (
                                <span className="text-white font-semibold text-sm">{agent.name.charAt(0)}</span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">{agent.name}</span>
                    </Link>
                    <button
                        onClick={handleContactClick}
                        className="contact-btn"
                    >
                        Contact
                    </button>
                </div>
            )}

            <Link href={generatePropertyUrl(property)} className="block">
                {/* Image Gallery */}
                <div
                    className="property-card-gallery"
                >
                    {/* Main Image */}
                    {images.length > 0 && !imageError ? (
                        <>
                            <Image
                                src={images[currentImageIndex]}
                                alt={propertyName}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className={`object-cover group-hover:scale-105 transition-all duration-500 ${!imageLoaded ? 'blur-md scale-110' : 'blur-0 scale-100'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                unoptimized
                            />
                            {!imageLoaded && (
                                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                            <svg className="w-16 h-16 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    )}

                    {/* Image Navigation */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => navigateImage('prev', e)}
                                className="carousel-nav carousel-nav-prev"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => navigateImage('next', e)}
                                className="carousel-nav carousel-nav-next"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* Pagination Dots */}
                            <div className="carousel-pagination">
                                {images.slice(0, 5).map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            setCurrentImageIndex(idx)
                                        }}
                                        className={`carousel-dot ${idx === currentImageIndex ? 'active' : ''}`}
                                    />
                                ))}
                                {images.length > 5 && (
                                    <span className="text-white text-xs ml-1">+{images.length - 5}</span>
                                )}
                            </div>
                        </>
                    )}

                    {/* Image Counter Badge */}
                    {images.length > 0 && (
                        <div className="image-counter-badge">
                            <span>{currentImageIndex + 1}/{images.length}</span>
                        </div>
                    )}



                    {/* Property Type & Status Badges */}
                    <div className="property-badge">
                        {/* Listing Type Badge (Sale/Rent/Project) */}
                        {listingBadge && (
                            <span className={`badge-pill ${listingBadge.className} shadow-md font-semibold`}>
                                {listingBadge.text}
                            </span>
                        )}
                        {isNew() && (
                            <span className="badge-pill shadow-md font-semibold text-rose-500">
                                New
                            </span>
                        )}
                        {property.tenure && (
                            <span className="badge-pill">{property.tenure}</span>
                        )}
                    </div>
                </div>
            </Link>

            {/* Card Content */}
            <div className="property-card-content">
                <Link href={generatePropertyUrl(property)} className="block">
                    {/* Price Section */}
                    <div className="price-section">
                        <div className="price-main">{getDisplayPrice()}</div>
                        {property.listing_type === 'sale' && (
                            property.price_per_sqft ? (
                                <div className="price-psf">RM {property.price_per_sqft.toFixed(2)} psf</div>
                            ) : formatPricePerSqft(property.price, propertySize) && (
                                <div className="price-psf">{formatPricePerSqft(property.price, propertySize)}</div>
                            )
                        )}
                        {property.listing_type === 'rent' && property.rent_details?.deposit_months && (
                            <div className="price-psf">{property.rent_details.deposit_months} month deposit</div>
                        )}
                    </div>

                    {/* Title & Location */}
                    <h3 className="property-title">{propertyName}</h3>
                    <p className="property-address">{property.address}</p>

                    {/* Feature Icons */}
                    <div className="property-features">
                        {bedroomCount && Number(bedroomCount) > 0 && (
                            <div className="feature-item">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>{bedroomCount}</span>
                            </div>
                        )}
                        {property.bathrooms && (
                            <div className="feature-item">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                                </svg>
                                <span>{property.bathrooms}</span>
                            </div>
                        )}
                        {propertySize && (
                            <>
                                <span className="feature-divider"></span>
                                <div className="feature-item">
                                    <span>{propertySize}</span>
                                </div>
                            </>
                        )}
                        {property.property_type && (
                            <>
                                <span className="feature-divider"></span>
                                <div className="feature-item">
                                    <span>{property.property_type}</span>
                                </div>
                            </>
                        )}
                        {property.built_year && (
                            <>
                                <span className="feature-divider"></span>
                                <div className="feature-item">
                                    <span>Built: {property.built_year}</span>
                                </div>
                            </>
                        )}
                    </div>
                </Link>

                {/* Footer: Recency & Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="property-recency">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Listed {getTimeAgo(property.created_at || property.scraped_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 relative z-10">
                        {/* Compare Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (isInCompare(property.id)) {
                                    removeFromCompare(property.id)
                                } else {
                                    addToCompare(property)
                                }
                            }}
                            disabled={!canAddMore && !isInCompare(property.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${isInCompare(property.id) ? 'bg-primary-50 text-primary-600' : 'text-gray-400 hover:bg-gray-100 hover:text-primary-500'} ${!canAddMore && !isInCompare(property.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={isInCompare(property.id) ? 'Remove from compare' : 'Add to compare'}
                            title={isInCompare(property.id) ? 'Remove from compare' : canAddMore ? 'Add to compare' : 'Compare list full (max 3)'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </button>
                        {/* Favorite Button */}
                        <button
                            onClick={handleFavoriteClick}
                            disabled={isToggling}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer relative z-20 ${favorited ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'}`}
                            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            <svg
                                className="w-5 h-5"
                                fill={favorited ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div >
        </div >
    )
}

// Memoize to prevent unnecessary re-renders in lists
export default memo(PropertyCard)
