import {
    X, Building2, Ruler, Calendar, DollarSign, MapPin, Layers, TrendingUp, ArrowUpRight, History, Scale, Check, Plus, Sparkles
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { Transaction } from '@/lib/types'
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
    const [loadingTrends, setLoadingTrends] = useState(false)

    // Reset trends when transaction changes
    useEffect(() => {
        setTrendTransactions([])
    }, [transaction?.id])

    // Fetch trends/history when tab is activated (Use Exact Location for specific building trends/history)
    useEffect(() => {
        if ((activeTab === 'trends' || activeTab === 'history') && transaction && trendTransactions.length === 0) {
            setLoadingTrends(true)
            // Filter by exact location to show history for this specific building/project
            getTransactions(1, {
                exactLat: transaction.latitude,
                exactLng: transaction.longitude
            })
                .then(data => setTrendTransactions(data.transactions as unknown as Transaction[]))
                .catch(err => console.error(err))
                .finally(() => setLoadingTrends(false))
        }
    }, [activeTab, transaction, trendTransactions.length])

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
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">

                        {/* 1. Hero Summary Section (Price + Key Specs) */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Transacted Price</span>
                                        <span className="bg-primary-50 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded border border-primary-100">NAPIC Verified</span>
                                    </div>
                                    <div className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">
                                        {formatPriceFull(transaction.price)}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                        <div className="text-right">
                                            <span className="block text-xs text-gray-400 font-medium uppercase">Price psf</span>
                                            <span className="block text-lg font-bold text-gray-900">RM {psf.toFixed(0)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Calendar size={14} />
                                        <span>Transacted on {formatDate(transaction.transaction_date)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Key Stats Grid - Integrated */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
                                <div className="flex flex-col gap-1 items-start justify-start">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        <Building2 size={14} /> Type
                                    </span>
                                    <span className="font-semibold text-gray-900 capitalize text-sm leading-tight">{transaction.property_type?.toLowerCase() || '-'}</span>
                                </div>
                                <div className="flex flex-col gap-1 items-start justify-start">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        <Scale size={14} /> Tenure
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${transaction.tenure?.toLowerCase().includes('free') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        <span className="font-semibold text-gray-900 text-sm leading-tight">{transaction.tenure || '-'}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 items-start justify-start">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        <Ruler size={14} /> Built-up
                                    </span>
                                    <span className="font-semibold text-gray-900 text-sm leading-tight">
                                        {transaction.built_up_sqft ? `${Number(transaction.built_up_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 items-start justify-start">
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                        <MapPin size={14} /> Land Area
                                    </span>
                                    <span className="font-semibold text-gray-900 text-sm leading-tight">
                                        {transaction.land_area_sqft ? `${Number(transaction.land_area_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Secondary Sections Layout */}
                        <div className="space-y-8">

                            {/* Left: Location & Details */}
                            <div className="space-y-8">

                                {/* Location Badge */}
                                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin size={18} className="text-primary-600" />
                                        Location Details
                                    </h3>
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Address</span>
                                            <span className="text-base font-bold text-gray-900 leading-snug">{transaction.address}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                                                {transaction.neighborhood}
                                            </span>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100">
                                                {transaction.district}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Amenities - Now inline */}
                                <div>
                                    {/* Removed Duplicate Title "Nearby Amenities" here because the component has its own */}
                                    {transaction.latitude && transaction.longitude && (
                                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden p-1">
                                            <NearbyAmenities
                                                latitude={transaction.latitude}
                                                longitude={transaction.longitude}
                                                radiusKm={3}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>


                        </div>
                    </div>


                ) : activeTab === 'trends' ? (<div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-y-auto pb-24 pr-2">
                    <div className="mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Market Trends: {transaction.address}</h3>
                        <p className="text-sm text-gray-500">Historical performance based on {trendTransactions.length} transactions at this location.</p>
                    </div>

                    {loadingTrends ? (
                        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-dotted border-gray-300">
                            <div className="flex flex-col items-center gap-2">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
                                <span className="text-sm text-gray-500 font-medium">Loading market data...</span>
                            </div>
                        </div>
                    ) : (
                        (() => {
                            const prices = trendTransactions.map(t => t.price)
                            const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1)
                            const psfs = trendTransactions.map(t => t.price / (t.built_up_sqft || t.land_area_sqft || 1))
                            const avgPsf = psfs.reduce((a, b) => a + b, 0) / (psfs.length || 1)

                            return (
                                <div className="space-y-6">
                                    {/* AI Market Analyst Card */}
                                    <div className="bg-purple-50/50 rounded-xl p-5 border border-purple-100 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-purple-400 to-pink-500 opacity-50"></div>
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-purple-600 shrink-0 border border-purple-50">
                                                    <Sparkles size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">AI Market Analyst</h4>
                                                    <p className="text-xs text-gray-500">Smart insights based on this data</p>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-white text-purple-600 text-xs font-bold border border-purple-100 rounded-lg hover:bg-purple-50 transition-colors shadow-sm whitespace-nowrap">
                                                Generate Insights
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 italic">Click "Generate Insights" to get a summary of price trends and market volume.</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Price Analysis */}
                                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">Price Analysis</h4>
                                                    <p className="text-[10px] text-gray-400">Avg vs Median Transaction Price</p>
                                                </div>
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Stable</span>
                                            </div>

                                            <div className="flex items-end justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Avg Price</span>
                                                    <span className="text-2xl font-black text-gray-900">
                                                        RM {(avgPrice >= 1000000 ? `${(avgPrice / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k` : avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }))}
                                                    </span>
                                                </div>
                                                {/* Mini Sparkline Placeholder */}
                                                <div className="flex gap-0.5 mb-1">
                                                    <div className="w-1 h-3 bg-gray-100 rounded-full"></div>
                                                    <div className="w-1 h-4 bg-gray-200 rounded-full"></div>
                                                    <div className="w-1 h-3 bg-gray-100 rounded-full"></div>
                                                    <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                                </div>
                                            </div>

                                            <div className="h-px bg-gray-100 w-full mb-2"></div>
                                            <div className="flex justify-between text-[10px] text-gray-400">
                                                <span>Low: RM {(Math.min(...prices) / 1000).toFixed(0)}k</span>
                                                <span>High: RM {(Math.max(...prices) / 1000).toFixed(0)}k</span>
                                            </div>
                                        </div>

                                        {/* PSF Analysis */}
                                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">PSF Analysis</h4>
                                                    <p className="text-[10px] text-gray-400">Price Per Sqft Performance</p>
                                                </div>
                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Stable</span>
                                            </div>

                                            <div className="flex items-end justify-between mb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Avg PSF</span>
                                                    <span className="text-2xl font-black text-gray-900">
                                                        RM {avgPsf.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                    </span>
                                                </div>
                                                <div className="flex gap-0.5 mb-1">
                                                    <div className="w-1 h-3 bg-gray-100 rounded-full"></div>
                                                    <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                                                    <div className="w-1 h-4 bg-gray-200 rounded-full"></div>
                                                </div>
                                            </div>

                                            <div className="h-px bg-gray-100 w-full mb-2"></div>
                                            <div className="flex justify-between text-[10px] text-gray-400">
                                                <span>Low: RM {Math.min(...psfs).toFixed(0)}</span>
                                                <span>High: RM {Math.max(...psfs).toFixed(0)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Full Chart */}
                                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                                        <div className="h-auto">
                                            <TrendChart transactions={trendTransactions} className="h-auto" minimal={true} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })()
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
                                                        {t.built_up_sqft ? `${Number(t.built_up_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}
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
