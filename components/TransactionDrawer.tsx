import { X, Building2, Ruler, Calendar, DollarSign, MapPin, Layers, TrendingUp, ArrowUpRight, History, Scale, Check, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Transaction } from '@/lib/supabase'
import MortgageCalculator from './MortgageCalculator'
import NearbyAmenities from './NearbyAmenities'
import ShareButton from './ShareButton'
import { formatPriceFull } from '@/lib/utils'
import TrendChart from './TrendChart'
import { getTransactions } from '@/lib/database'

interface TransactionDrawerProps {
    transaction: Transaction | null
    onClose: () => void
    isOpen: boolean
    isInComparison?: boolean
    onToggleComparison?: () => void
}

export default function TransactionDrawer({ transaction, onClose, isOpen, isInComparison, onToggleComparison }: TransactionDrawerProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'trends' | 'history'>('details')
    const [trendTransactions, setTrendTransactions] = useState<Transaction[]>([])
    const [propertyTransactions, setPropertyTransactions] = useState<Transaction[]>([]) // NEW: Specific property history
    const [loadingTrends, setLoadingTrends] = useState(false)

    // Fetch trends/history when tab is activated
    useEffect(() => {
        if ((activeTab === 'trends' || activeTab === 'history') && transaction && trendTransactions.length === 0) {
            setLoadingTrends(true)
            // Filter by similar neighborhood and type
            getTransactions(1, 1000, {
                neighborhood: transaction.neighborhood || undefined,
            })
                .then(data => setTrendTransactions(data))
                .catch(err => console.error(err))
                .finally(() => setLoadingTrends(false))
        }
    }, [activeTab, transaction, trendTransactions.length])

    // Fetch specific property history immediately when transaction changes
    useEffect(() => {
        if (transaction?.address) {
            getTransactions(1, 20, {
                address: transaction.address,
                // Ensure we don't just get the same one if possible, though ID filtering happens in render
                // We want strictly this address
            })
                .then(data => setPropertyTransactions(data))
                .catch(console.error)
        } else {
            setPropertyTransactions([])
        }
    }, [transaction])

    if (!transaction) return null

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const psf = transaction.price / (transaction.built_up_sqft || transaction.land_area_sqft || 1)

    return (
        <div
            className={`fixed inset-x-0 bottom-0 z-[2001] w-full h-auto max-h-[700px] bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] transform transition-transform duration-300 ease-in-out rounded-t-2xl border-t border-gray-100 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
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
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">

                        <ShareButton
                            url={`${window.location.origin}/transaction-map?transaction_id=${transaction.id}`}
                            title={`Check out this property at ${transaction.address}`}
                            variant="icon"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
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
                <div className="flex px-6 gap-6 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'details' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Details
                        {activeTab === 'details' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('trends')}
                        className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'trends' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Market Trends
                        {activeTab === 'trends' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap ${activeTab === 'history' ? 'text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        History
                        {activeTab === 'history' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full"></div>}
                    </button>
                </div>


            </div>

            {/* Content */}
            <div className="overflow-y-auto px-6 py-6 pb-12 max-h-[500px]">
                {activeTab === 'details' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                        {/* Column 1: Price, Metrics & History */}
                        <div className="space-y-4 flex flex-col h-full">
                            <div className="bg-primary-50 rounded-xl p-5 border border-primary-100 flex-shrink-0">
                                <span className="text-primary-600 text-xs font-bold uppercase tracking-wider mb-1 block">Transacted Price</span>
                                <div className="text-3xl font-extrabold text-gray-900 mb-1">{formatPriceFull(transaction.price)}</div>
                                <div className="flex items-center gap-2 text-primary-700 font-medium text-sm">
                                    <DollarSign size={14} />
                                    <span>RM {psf.toFixed(0)} per sqft</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-primary-100/50 pt-2">
                                    <span className="text-xs text-primary-800 font-medium">{formatDate(transaction.transaction_date)}</span>
                                    <span className="text-[10px] uppercase font-bold text-primary-400">NAPIC</span>
                                </div>
                            </div>


                            {/* History (Moved Here) */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-0 overflow-hidden flex-grow flex flex-col min-h-[200px]">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                        <Layers size={14} className="text-indigo-600" /> Property History
                                    </h3>
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                                        {propertyTransactions.filter(t => t.id !== transaction.id).length} Past Records
                                    </span>
                                </div>

                                <div className="overflow-y-auto flex-grow p-0">
                                    {propertyTransactions.filter(t => t.id !== transaction.id).length > 0 ? (
                                        <div className="divide-y divide-gray-50">
                                            {propertyTransactions
                                                .filter(t => t.id !== transaction.id)
                                                .sort((a, b) => new Date(b.transaction_date!).getTime() - new Date(a.transaction_date!).getTime())
                                                .map((t) => (
                                                    <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <span className="font-bold text-gray-900">{formatPriceFull(t.price)}</span>
                                                            <span className="text-xs text-gray-400 font-medium">{formatDate(t.transaction_date)}</span>
                                                        </div>
                                                        <div className="text-xs text-gray-500 mb-1.5 font-medium truncate">
                                                            {t.property_type || 'Unknown Type'}
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                                                                RM {(t.price / (t.built_up_sqft || t.land_area_sqft || 1)).toFixed(0)} psf
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 uppercase">NAPIC</span>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2 h-full justify-center">
                                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-1">
                                                <Layers size={20} className="text-gray-300" />
                                            </div>
                                            No other transactions found for this specific unit.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Property Info (Specs Only) */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Building2 size={16} /> Property Specifications
                            </h3>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 h-full max-h-[500px] overflow-y-auto">
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

                        {/* Column 3: Nearby Amenities (Restored) */}
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
                ) : activeTab === 'trends' ? (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Market Trends: {transaction.neighborhood}</h3>
                            <p className="text-sm text-gray-500">Historical performance based on {trendTransactions.length > 0 ? trendTransactions.length : '...'} transactions.</p>
                        </div>

                        {loadingTrends ? (
                            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dotted border-gray-300">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
                                    <span className="text-sm text-gray-500 font-medium">Loading market data...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[400px]">
                                <TrendChart transactions={trendTransactions} className="h-full border border-gray-100 rounded-xl shadow-sm" />
                            </div>
                        )}
                    </div>
                ) : activeTab === 'history' ? (
                    <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Transaction History</h3>
                                <p className="text-sm text-gray-500">
                                    Showing {trendTransactions.length} records in {transaction.neighborhood}
                                </p>
                            </div>
                        </div>

                        {loadingTrends ? (
                            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dotted border-gray-300">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
                                    <span className="text-sm text-gray-500 font-medium">Loading history...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Date</th>
                                            <th className="px-4 py-3 font-medium text-right">Price</th>
                                            <th className="px-4 py-3 font-medium text-right">PSF</th>
                                            <th className="px-4 py-3 font-medium">Size</th>
                                            <th className="px-4 py-3 font-medium">Type</th>
                                            <th className="px-4 py-3 font-medium">Tenure</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {trendTransactions.sort((a, b) => new Date(b.transaction_date!).getTime() - new Date(a.transaction_date!).getTime()).map((t) => {
                                            const tPsf = t.price / (t.built_up_sqft || t.land_area_sqft || 1)
                                            return (
                                                <tr key={t.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">
                                                        {formatDate(t.transaction_date)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-primary-600 whitespace-nowrap">
                                                        {formatPriceFull(t.price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">
                                                        RM {tPsf.toFixed(0)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                                        {t.built_up_sqft ? `${t.built_up_sqft} sqft` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600 capitalize whitespace-nowrap">
                                                        {t.property_type?.toLowerCase() || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500 text-xs uppercase whitespace-nowrap">
                                                        {t.tenure || '-'}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
