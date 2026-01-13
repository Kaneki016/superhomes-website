import { X, Building2, Ruler, Calendar, DollarSign, MapPin, Layers, ExternalLink, User } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { Property } from '@/lib/supabase'
import MortgageCalculator from './MortgageCalculator'
import ShareButton from './ShareButton'

interface ListingDrawerProps {
    listing: Property | null
    onClose: () => void
    isOpen: boolean
}

export default function ListingDrawer({ listing, onClose, isOpen }: ListingDrawerProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'mortgage'>('details')

    if (!listing) return null

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatPrice = (price?: number | null) => {
        if (!price) return 'Price on Ask'
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            maximumFractionDigits: 0
        }).format(price)
    }

    // Use pre-calculated psf if available, else calculate
    const psf = listing.price_per_sqft ||
        ((listing.price && listing.floor_area_sqft) ? listing.price / parseFloat(listing.floor_area_sqft) : 0)

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[2001] w-full h-auto max-h-[85vh] bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] transform transition-transform duration-300 ease-in-out rounded-t-2xl border-t border-gray-100 flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 rounded-t-2xl border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                        {/* Thumbnail in Header */}
                        {listing.main_image_url && (
                            <img
                                src={listing.main_image_url}
                                alt={listing.title}
                                className="w-16 h-16 rounded-lg object-cover shadow-sm border border-gray-100 flex-shrink-0"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                        )}
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 truncate">
                                {listing.title}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                <MapPin size={14} className="text-primary-600 flex-shrink-0" />
                                <span className="truncate">{listing.address || listing.district || 'Location not specified'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded shadow-sm uppercase tracking-wide ${listing.listing_type === 'rent' ? 'bg-blue-100 text-blue-700' : 'bg-primary-100 text-primary-700'}`}>
                            {listing.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                        </span>
                        <ShareButton
                            url={`${typeof window !== 'undefined' ? window.location.origin : ''}/properties/${listing.id}`}
                            title={`Check out ${listing.title}`}
                            variant="icon"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        />
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {listing.price && (
                    <div className="flex px-6 gap-6">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'details' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Details
                            {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('mortgage')}
                            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'mortgage' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mortgage Calculator
                            {activeTab === 'mortgage' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></div>}
                        </button>
                    </div>
                )}
            </div>

            {/* Content w/ Horizontal Layout */}
            <div className="overflow-y-auto px-6 py-6 pb-12">
                {activeTab === 'details' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* Column 1: Price & Key Metrics */}
                        <div className="space-y-4">
                            <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                                <span className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-1 block">Listing Price</span>
                                <div className="text-3xl font-extrabold text-gray-900 mb-1">{formatPrice(listing.price)}</div>
                                <div className="flex items-center gap-2 text-primary-700 font-medium text-sm">
                                    <DollarSign size={14} />
                                    <span>{psf > 0 ? `RM ${psf.toFixed(0)} per sqft` : 'Price on Ask'}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Listed Date</span>
                                    <span className="font-semibold text-gray-900 text-sm">
                                        {listing.scraped_at ? formatDate(listing.scraped_at) : 'Recently'}
                                    </span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Source</span>
                                    <span className="font-semibold text-gray-900 text-sm uppercase tracking-tight">PropertyGuru</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Property Info */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Building2 size={16} /> Property Specifications
                            </h3>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full max-h-[300px] overflow-y-auto">
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium">Property Type</span>
                                        <p className="text-gray-900 font-semibold text-sm">{listing.property_type || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium">Tenure</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${listing.tenure?.toLowerCase().includes('free') ? 'bg-green-500' : 'bg-yellow-500 '}`}></span>
                                            <p className="text-gray-900 font-semibold text-sm">{listing.tenure || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1"><Ruler size={12} /> Built-up Size</span>
                                        <p className="text-gray-900 font-semibold text-sm">{listing.floor_area_sqft || listing.size || '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1"><Ruler size={12} /> Land Area</span>
                                        <p className="text-gray-900 font-semibold text-sm">{listing.land_area_sqft || '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">🛌 Bedrooms</span>
                                        <p className="text-gray-900 font-semibold text-sm">{listing.bedrooms_num || listing.total_bedrooms || '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1">🚿 Bathrooms</span>
                                        <p className="text-gray-900 font-semibold text-sm">{listing.bathrooms || '-'}</p>
                                    </div>
                                    <div className="space-y-1 col-span-2">
                                        <span className="text-xs text-gray-500 uppercase font-medium">Furnishing</span>
                                        <p className="text-gray-900 font-semibold text-sm">{listing.furnishing || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Actions & Description */}
                        <div className="flex flex-col h-full">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <User size={16} /> Contact & Actions
                            </h3>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-grow flex flex-col gap-4">
                                <Link
                                    href={`/properties/${listing.id}`}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors shadow-md flex items-center justify-center gap-2"
                                >
                                    <span>View Property Details</span>
                                    <ExternalLink size={16} />
                                </Link>

                                <div className="mt-2">
                                    <span className="text-xs text-gray-500 uppercase font-medium block mb-2">Description Preview</span>
                                    <p className="text-gray-600 text-xs leading-relaxed line-clamp-6">
                                        {listing.description || 'No description available.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
                        {listing.price && <MortgageCalculator propertyPrice={listing.price} defaultExpanded={true} />}
                    </div>
                )}
            </div>
        </div>
    )
}
