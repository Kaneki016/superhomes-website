import { X, Building2, Ruler, Calendar, DollarSign, MapPin, Layers, TrendingUp, ArrowUpRight, History, Scale, Check, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Transaction } from '@/lib/supabase'
import MortgageCalculator from './MortgageCalculator'
import NearbyAmenities from './NearbyAmenities'
import ShareButton from './ShareButton'
import { formatPriceFull } from '@/lib/utils'
import TrendChart from './TrendChart'
import { getTransactions } from '@/app/actions/property-actions'

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
            className={`fixed z-[2001] bg-white shadow-xl transition-transform duration-300 ease-in-out
                inset-x-0 bottom-0 w-full h-auto max-h-[700px] rounded-t-2xl border-t border-gray-100 
                lg:inset-y-0 lg:right-0 lg:w-1/2 lg:h-[calc(100vh-145px)] lg:left-auto lg:top-[145px] lg:rounded-none lg:rounded-l-2xl lg:border-l lg:border-t-0 lg:max-h-screen
                ${isOpen ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'}`}
        >
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 rounded-t-2xl border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between px-6 py-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                            <MapPin size={20} className="text-primary-600 fill-primary-50" />
                            {transaction.address || 'Transaction Details'}
                        </h2>
                        {transaction.address && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                    ID: {String(transaction.id).slice(0, 8)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <ShareButton
                            url={`${window.location.origin}/transaction-map?transaction_id=${transaction.id}`}
                            title={`Check out this property at ${transaction.address}`}
                            variant="icon"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        />
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-6 gap-8 overflow-x-auto no-scrollbar border-b border-gray-50">
                    {['details', 'trends', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap capitalize tracking-wide ${activeTab === tab ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {tab === 'details' ? 'Property Details' : tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full shadow-sm"></div>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto lg:overflow-hidden px-6 py-6 pb-24 h-[calc(100vh-140px)] bg-gray-50/50">
                {activeTab === 'details' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">

                        {/* Column 1: Price, Metrics & History */}
                        <div className="space-y-6 flex flex-col h-full lg:overflow-hidden">
                            {/* Premium Price Card */}
                            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg shadow-primary-900/10 relative overflow-hidden flex-shrink-0">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black opacity-10 rounded-full -ml-8 -mb-8 blur-xl"></div>

                                <span className="text-primary-100 text-xs font-bold uppercase tracking-widest mb-2 block relative z-10">Transacted Price</span>
                                <div className="text-4xl font-black mb-2 tracking-tight relative z-10">{formatPriceFull(transaction.price)}</div>

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                        <DollarSign size={14} className="text-white" />
                                        <span className="font-bold text-sm">RM {psf.toFixed(0)} psf</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-primary-100 text-xs font-medium">
                                        <Calendar size={12} />
                                        <span>{formatDate(transaction.transaction_date)}</span>
                                    </div>
                                </div>

                                <div className="absolute top-5 right-5">
                                    <span className="text-[10px] font-black bg-white/10 text-white backdrop-blur-md px-2 py-1 rounded text-center border border-white/10 shadow-sm">
                                        NAPIC
                                    </span>
                                </div>
                            </div>


                            {/* History (Moved Here) */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-0 overflow-hidden flex-grow flex flex-col min-h-0">
                                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                        <Layers size={14} className="text-indigo-600" /> Property History
                                    </h3>
                                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                                        {propertyTransactions.filter(t => t.id !== transaction.id).length} Past Records
                                    </span>
                                </div>

                                <div className="overflow-y-auto flex-grow px-0 py-2">
                                    {propertyTransactions.filter(t => t.id !== transaction.id).length > 0 ? (
                                        <div className="relative pl-6 pr-4 space-y-0">
                                            {/* Vertical Timeline Line */}
                                            <div className="absolute left-[29px] top-4 bottom-4 w-0.5 bg-gray-100 z-0"></div>

                                            {propertyTransactions
                                                .filter(t => t.id !== transaction.id)
                                                .sort((a, b) => new Date(b.transaction_date!).getTime() - new Date(a.transaction_date!).getTime())
                                                .map((t, index) => (
                                                    <div key={t.id} className="relative z-10 py-3 group">
                                                        <div className="flex items-start gap-3">
                                                            {/* Timeline Dot */}
                                                            <div className="mt-1.5 w-2 h-2 rounded-full border-2 border-primary-500 bg-white group-hover:bg-primary-500 group-hover:scale-125 transition-all shadow-sm"></div>

                                                            <div className="flex-grow bg-white border border-gray-100 rounded-lg p-3 shadow-sm group-hover:border-primary-200 group-hover:shadow-md transition-all">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="font-bold text-gray-900 text-lg">{formatPriceFull(t.price)}</span>
                                                                    <span className="text-xs text-gray-400 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{formatDate(t.transaction_date)}</span>
                                                                </div>

                                                                <div className="flex justify-between items-center mt-2">
                                                                    <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2 py-1 rounded text-xs font-bold">
                                                                        <DollarSign size={10} />
                                                                        RM {(t.price / (t.built_up_sqft || t.land_area_sqft || 1)).toFixed(0)} psf
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                                                                        <Check size={10} className="text-emerald-500" /> NAPIC
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center gap-3 h-full justify-center opacity-60">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-1 ring-1 ring-gray-100">
                                                <History size={20} className="text-gray-300" />
                                            </div>
                                            <p>No other history found.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Specs & Amenities (Right Column) */}
                        <div className="space-y-6 flex flex-col h-full lg:overflow-y-auto no-scrollbar">
                            {/* Property Specs */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Building2 size={16} /> Property Specifications
                                </h3>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <Building2 size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Type</span>
                                            </div>
                                            <span className="font-bold text-gray-900">{transaction.property_type || '-'}</span>
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-full opacity-50"></div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <Scale size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Tenure</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ring-2 ring-offset-1 ${transaction.tenure?.toLowerCase().includes('free') ? 'bg-emerald-500 ring-emerald-200' : 'bg-amber-500 ring-amber-200'}`}></span>
                                                <span className="font-bold text-gray-900">{transaction.tenure || '-'}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <Ruler size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Built-up</span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {transaction.built_up_sqft ? `${Number(transaction.built_up_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 relative overflow-hidden">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <MapPin size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Land Area</span>
                                            </div>
                                            <span className="font-bold text-gray-900">
                                                {transaction.land_area_sqft ? `${Number(transaction.land_area_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}
                                            </span>
                                        </div>

                                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col gap-2 relative overflow-hidden col-span-2">
                                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                                <MapPin size={16} />
                                                <span className="text-xs font-bold uppercase tracking-wider">Location</span>
                                            </div>
                                            <div className="font-bold text-gray-900 flex flex-col">
                                                <span>{transaction.neighborhood}</span>
                                                <span className="text-xs font-normal text-gray-500 uppercase">{transaction.district}</span>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Nearby Amenities */}
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
            </div >
        </div >
    )
}
