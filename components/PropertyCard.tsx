'use client'

import { useState, useEffect, memo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Property } from '@/lib/supabase'
import { getAgentByAgentId } from '@/lib/database'
import { Agent } from '@/lib/supabase'
import { useFavorites } from '@/contexts/FavoritesContext'
import { useAuth } from '@/contexts/AuthContext'
import { useCompare } from '@/contexts/CompareContext'

interface PropertyCardProps {
    property: Property
    agent?: Agent | null  // Optional: pass agent from parent to avoid N+1 fetches
}

function PropertyCard({ property, agent: providedAgent }: PropertyCardProps) {
    const [agent, setAgent] = useState<Agent | null>(providedAgent || null)
    const { user } = useAuth()
    const { isFavorite, toggleFavorite } = useFavorites()
    const { isInCompare, addToCompare, removeFromCompare, canAddMore } = useCompare()
    const router = useRouter()
    const [isToggling, setIsToggling] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const favorited = isFavorite(property.id)

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

        // Fallback: fetch agent by ID
        async function loadAgent() {
            if (property.agent_id) {
                const agentData = await getAgentByAgentId(property.agent_id)
                setAgent(agentData)
            }
        }
        loadAgent()
    }, [property.agent_id, property.contacts, providedAgent])

    // Format price based on listing type
    const formatPrice = (price: number | null | undefined, isRent: boolean = false) => {
        if (!price) return 'Price on Request'
        const formatted = new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(price)
        return isRent ? `${formatted}/month` : formatted
    }

    // Get display price based on listing type
    const getDisplayPrice = () => {
        if (property.listing_type === 'rent') {
            const rentPrice = property.rent_details?.monthly_rent || property.price
            return formatPrice(rentPrice, true)
        }
        return formatPrice(property.price, false)
    }

    const formatPricePerSqft = (price: number | null | undefined, size: string | null | undefined) => {
        if (!price || !size) return null
        const sizeNum = parseInt(size.replace(/[^0-9]/g, ''))
        if (!sizeNum || sizeNum === 0) return null
        const psf = price / sizeNum
        return `RM ${psf.toFixed(2)} psf`
    }

    const getTimeAgo = (dateString: string | undefined) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!user) {
            router.push('/login')
            return
        }

        if (isToggling) return

        setIsToggling(true)
        await toggleFavorite(property.id)
        setIsToggling(false)
    }

    const handleContactClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

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
                `${typeof window !== 'undefined' ? `${window.location.origin}/properties/${property.id}` : ''}`,
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
                return { text: 'For Sale', className: 'bg-green-500 text-white' }
            case 'rent':
                return { text: 'For Rent', className: 'bg-blue-500 text-white' }
            case 'project':
                return { text: 'New Project', className: 'bg-purple-500 text-white' }
            default:
                return null
        }
    }

    const listingBadge = getListingTypeBadge()
    const propertyName = property.title || property.property_name || 'Property'
    const propertySize = property.floor_area_sqft || property.size || ''
    const bedroomCount = property.total_bedrooms || property.bedrooms_num || property.bedrooms

    return (
        <div className="property-card-v2 group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 active:scale-[0.98] touch-manipulation">
            {/* Agent Header */}
            {agent && (
                <div className="property-card-header">
                    <Link href={`/agents/${agent.id || agent.agent_id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                        <div className="property-card-avatar group-hover:ring-2 group-hover:ring-primary-300 transition-all">
                            {agent.photo_url ? (
                                <img
                                    src={agent.photo_url}
                                    alt={agent.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.parentElement!.innerHTML = `<span class="text-white font-semibold text-sm">${agent.name.charAt(0)}</span>`
                                    }}
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

            <Link href={`/properties/${property.id}`} className="block">
                {/* Image Gallery */}
                <div
                    className="property-card-gallery"
                >
                    {/* Main Image */}
                    {images.length > 0 && !imageError ? (
                        <>
                            <img
                                src={images[currentImageIndex]}
                                alt={propertyName}
                                loading="lazy"
                                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${!imageLoaded ? 'blur-md scale-110' : 'blur-0 scale-100'}`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
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

                    {/* Favorite & Compare Actions */}
                    <div className="gallery-actions">
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
                            className={`action-btn ${isInCompare(property.id) ? 'active bg-primary-500 text-white' : ''} ${!canAddMore && !isInCompare(property.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            aria-label={isInCompare(property.id) ? 'Remove from compare' : 'Add to compare'}
                            title={isInCompare(property.id) ? 'Remove from compare' : canAddMore ? 'Add to compare' : 'Compare list full (max 3)'}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </button>
                        {/* Favorite Button */}
                        <button
                            onClick={handleFavoriteClick}
                            disabled={isToggling}
                            className={`action-btn ${favorited ? 'active' : ''}`}
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

                    {/* Property Type & Status Badges */}
                    <div className="property-badge">
                        {/* Listing Type Badge (Sale/Rent/Project) */}
                        {listingBadge && (
                            <span className={`badge-pill ${listingBadge.className} shadow-md font-semibold`}>
                                {listingBadge.text}
                            </span>
                        )}
                        {isNew() && (
                            <span className="badge-pill bg-gradient-primary text-white shadow-md font-semibold">
                                ✨ New
                            </span>
                        )}
                        {property.tenure && (
                            <span className="badge-pill">{property.tenure}</span>
                        )}
                    </div>
                </div>

                {/* Card Content */}
                <div className="property-card-content">
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

                    {/* Recency */}
                    <div className="property-recency">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Listed {getTimeAgo(property.created_at || property.scraped_at)}</span>
                    </div>
                </div>
            </Link>
        </div>
    )
}

// Memoize to prevent unnecessary re-renders in lists
export default memo(PropertyCard)
