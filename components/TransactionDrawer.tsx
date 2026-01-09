import { X, Building2, Ruler, Calendar, DollarSign, MapPin, Layers } from 'lucide-react'
import { useState } from 'react'
import { Transaction } from '@/lib/supabase'
import MortgageCalculator from './MortgageCalculator'
import NearbyAmenities from './NearbyAmenities'
import ShareButton from './ShareButton'

interface TransactionDrawerProps {
    transaction: Transaction | null
    onClose: () => void
    isOpen: boolean
}

export default function TransactionDrawer({ transaction, onClose, isOpen }: TransactionDrawerProps) {
    if (!transaction) return null

    const [activeTab, setActiveTab] = useState<'details' | 'mortgage'>('details')

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            maximumFractionDigits: 0
        }).format(price)
    }

    const psf = transaction.price / (transaction.built_up_sqft || transaction.land_area_sqft || 1)

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[2001] w-full h-auto max-h-[600px] bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] transform transition-transform duration-300 ease-in-out rounded-t-2xl border-t border-gray-100 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        >
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 rounded-t-2xl border-b border-gray-100">
                <div className="flex items-center justify-between px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <MapPin size={18} className="text-primary-600" />
                            {transaction.address || 'Transaction Details'}
                        </h2>
                        {transaction.address && <p className="text-xs text-gray-500 mt-0.5">Transaction ID: {String(transaction.id).slice(0, 8)}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <ShareButton
                            url={`${window.location.origin}/transaction-map?transaction_id=${transaction.id}`}
                            title={`Check out this property at ${transaction.address}`}
                            className="!py-1.5 !px-3 !text-xs !bg-gray-100 !border-transparent hover:!bg-gray-200"
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
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-6 pb-12 max-h-[500px]">
                {activeTab === 'details' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* Column 1: Price & Key Metrics */}
                        <div className="space-y-4">
                            <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                                <span className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-1 block">Transacted Price</span>
                                <div className="text-3xl font-extrabold text-gray-900 mb-1">{formatPrice(transaction.price)}</div>
                                <div className="flex items-center gap-2 text-primary-700 font-medium text-sm">
                                    <DollarSign size={14} />
                                    <span>RM {psf.toFixed(0)} per sqft</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Date</span>
                                    <span className="font-semibold text-gray-900 text-sm">{formatDate(transaction.transaction_date)}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <span className="block text-[10px] uppercase text-gray-400 font-bold mb-1">Source</span>
                                    <span className="font-semibold text-gray-900 text-sm uppercase tracking-tight">NAPIC</span>
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
                                        <p className="text-gray-900 font-semibold text-sm">{transaction.property_type || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium">Tenure</span>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${transaction.tenure?.toLowerCase().includes('free') ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <p className="text-gray-900 font-semibold text-sm">{transaction.tenure || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1"><Ruler size={12} /> Built-up Size</span>
                                        <p className="text-gray-900 font-semibold text-sm">{transaction.built_up_sqft ? `${Number(transaction.built_up_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1"><Ruler size={12} /> Land Area</span>
                                        <p className="text-gray-900 font-semibold text-sm">{transaction.land_area_sqft ? `${Number(transaction.land_area_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium flex items-center gap-1"><Layers size={12} /> Unit Level</span>
                                        <p className="text-gray-900 font-semibold text-sm">{transaction.unit_level || '-'}</p>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 uppercase font-medium">District</span>
                                        <p className="text-gray-900 font-semibold capitalize text-sm">{transaction.district?.toLowerCase() || '-'}</p>
                                    </div>

                                    <div className="space-y-1 col-span-2">
                                        <span className="text-xs text-gray-500 uppercase font-medium">Neighborhood</span>
                                        <p className="text-gray-900 font-semibold capitalize text-sm">{transaction.neighborhood?.toLowerCase() || '-'}</p>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Column 3: Nearby Amenities (Moved Here) */}
                        <div>
                            {transaction.latitude && transaction.longitude && (
                                <NearbyAmenities
                                    latitude={transaction.latitude}
                                    longitude={transaction.longitude}
                                    radiusKm={3}
                                />
                            )}
                        </div>

                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl mx-auto">
                        <MortgageCalculator propertyPrice={transaction.price} defaultExpanded={true} />
                    </div>
                )}
            </div>
        </div>
    )
}
