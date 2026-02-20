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
import ChartModal from './ChartModal'
import { ChartType } from './TrendChart'
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
    const [selectedChartType, setSelectedChartType] = useState<ChartType | null>(null)

    const openChart = (type: ChartType) => setSelectedChartType(type)
    const closeChart = () => setSelectedChartType(null)

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
                inset-x-0 bottom-0 w-full h-auto max-h-[85dvh] rounded-t-2xl border-t border-gray-100 
                lg:inset-y-0 lg:right-0 lg:w-1/2 lg:h-[calc(100vh-145px)] lg:left-auto lg:top-[145px] lg:rounded-none lg:rounded-l-2xl lg:border-l lg:border-t-0 lg:max-h-screen
                ${isOpen ? 'translate-y-0 lg:translate-x-0' : 'translate-y-full lg:translate-x-full'}`}
        >
            {/* Header */}
            <div className="bg-white sticky top-0 z-10 rounded-t-2xl border-b border-gray-100 flex-shrink-0">
                {/* Mobile drag handle */}
                <div className="lg:hidden flex justify-center pt-2.5 pb-1">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                <div className="flex items-center gap-2 px-4 py-3 lg:px-6 lg:py-5">
                    {/* Title — min-w-0 + truncate prevent it from squeezing the close button */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base lg:text-xl font-bold text-gray-900 flex items-center gap-2 mb-0.5 truncate">
                            <MapPin size={16} className="text-primary-600 fill-primary-50 flex-shrink-0" />
                            <span className="truncate">{transaction.address || 'Transaction Details'}</span>
                        </h2>
                        {transaction.address && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                    ID: {String(transaction.id).slice(0, 8)}
                                </span>
                            </div>
                        )}
                    </div>
                    {/* Action buttons — flex-shrink-0 so they're ALWAYS fully visible */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <ShareButton
                            url={`${window.location.origin}/transaction-map?transaction_id=${transaction.id}`}
                            title={`Check out this property at ${transaction.address}`}
                            variant="icon"
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        />
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Close"
                        >
                            <X size={22} />
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
            <div className="overflow-y-auto overflow-x-hidden lg:overflow-hidden px-3 lg:px-6 py-4 lg:py-6 pb-24 h-[calc(100vh-140px)] bg-gray-50/50">
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


                ) : activeTab === 'trends' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-3 pb-24">

                        {loadingTrends ? (
                            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dotted border-gray-200">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary-600 border-t-transparent"></div>
                                    <span className="text-xs text-gray-400">Loading market data...</span>
                                </div>
                            </div>
                        ) : trendTransactions.length === 0 ? (
                            <div className="h-48 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm font-medium">No trend data</p>
                                <p className="text-xs mt-1">No other transactions found at this location.</p>
                            </div>
                        ) : (() => {
                            const prices = trendTransactions.map(t => t.price)
                            const avgPrice = prices.reduce((a, b) => a + b, 0) / (prices.length || 1)
                            const psfs = trendTransactions.map(t => t.price / (t.built_up_sqft || t.land_area_sqft || 1))
                            const avgPsf = psfs.reduce((a, b) => a + b, 0) / (psfs.length || 1)
                            const minPrice = Math.min(...prices)
                            const maxPrice = Math.max(...prices)
                            const minPsf = Math.min(...psfs)
                            const maxPsf = Math.max(...psfs)

                            // Property type distribution for the volume card
                            const typeCounts: Record<string, number> = {}
                            trendTransactions.forEach(t => {
                                const type = (t.property_type || 'Unknown').toLowerCase()
                                typeCounts[type] = (typeCounts[type] || 0) + 1
                            })
                            const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]

                            return (
                                <div className="space-y-3">
                                    {/* ── Section heading ── */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Market Trends</h3>
                                            <p className="text-[11px] text-gray-400">{trendTransactions.length} transactions at this location</p>
                                        </div>
                                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Tap to view chart</span>
                                    </div>

                                    {/* ── 3 chart selection cards ── */}

                                    {/* 1. Price Analysis */}
                                    <button
                                        onClick={() => openChart('price')}
                                        className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 active:scale-[0.98] transition-all duration-200 overflow-hidden group"
                                    >
                                        <div className="flex items-stretch">
                                            {/* Colored left accent bar */}
                                            <div className="w-1 bg-blue-500 rounded-l-2xl flex-shrink-0" />
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                                            <TrendingUp size={15} className="text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-tight">Price Analysis</p>
                                                            <p className="text-[10px] text-gray-400">Avg vs Median price</p>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors mt-1 flex-shrink-0" />
                                                </div>
                                                <div className="flex items-end gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Avg</p>
                                                        <p className="text-base font-black text-gray-900">
                                                            RM {avgPrice >= 1000000 ? `${(avgPrice / 1000000).toFixed(2)}M` : `${(avgPrice / 1000).toFixed(0)}k`}
                                                        </p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-gray-400 font-medium">Range</p>
                                                        <p className="text-xs text-gray-600 font-semibold">
                                                            {(minPrice / 1000).toFixed(0)}k – {(maxPrice / 1000).toFixed(0)}k
                                                        </p>
                                                    </div>
                                                    {/* Mini sparkline bars */}
                                                    <div className="flex items-end gap-0.5 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
                                                        {[45, 70, 55, 80, 65, 90, 72].map((h, i) => (
                                                            <div key={i} className="w-1.5 bg-blue-400 rounded-full" style={{ height: `${h}%` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* 2. PSF Analysis */}
                                    <button
                                        onClick={() => openChart('psf')}
                                        className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-purple-100 active:scale-[0.98] transition-all duration-200 overflow-hidden group"
                                    >
                                        <div className="flex items-stretch">
                                            <div className="w-1 bg-purple-500 rounded-l-2xl flex-shrink-0" />
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                                                            <Layers size={15} className="text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-tight">PSF Analysis</p>
                                                            <p className="text-[10px] text-gray-400">Price per sqft</p>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors mt-1 flex-shrink-0" />
                                                </div>
                                                <div className="flex items-end gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Avg PSF</p>
                                                        <p className="text-base font-black text-gray-900">RM {avgPsf.toFixed(0)}</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-gray-400 font-medium">Range</p>
                                                        <p className="text-xs text-gray-600 font-semibold">
                                                            RM {minPsf.toFixed(0)} – {maxPsf.toFixed(0)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-end gap-0.5 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
                                                        {[55, 40, 75, 60, 85, 50, 80].map((h, i) => (
                                                            <div key={i} className="w-1.5 bg-purple-400 rounded-full" style={{ height: `${h}%` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* 3. Market Activity */}
                                    <button
                                        onClick={() => openChart('volume')}
                                        className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 active:scale-[0.98] transition-all duration-200 overflow-hidden group"
                                    >
                                        <div className="flex items-stretch">
                                            <div className="w-1 bg-emerald-500 rounded-l-2xl flex-shrink-0" />
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2.5 mb-2">
                                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                            <History size={15} className="text-emerald-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 leading-tight">Market Activity</p>
                                                            <p className="text-[10px] text-gray-400">Volume by property type</p>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-colors mt-1 flex-shrink-0" />
                                                </div>
                                                <div className="flex items-end gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-gray-400 font-medium">Total</p>
                                                        <p className="text-base font-black text-gray-900">{trendTransactions.length}</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-[10px] text-gray-400 font-medium">Top type</p>
                                                        <p className="text-xs text-gray-600 font-semibold capitalize">
                                                            {topType ? `${topType[0]} (${topType[1]})` : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-end gap-0.5 h-8 opacity-40 group-hover:opacity-80 transition-opacity">
                                                        {[30, 60, 45, 80, 55, 70, 65].map((h, i) => (
                                                            <div key={i} className="w-1.5 bg-emerald-400 rounded-full" style={{ height: `${h}%` }} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                </div>
                            )
                        })()}
                    </div>
                ) : activeTab === 'history' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
                        <div className="mb-4">
                            <h3 className="text-base font-bold text-gray-900 mb-0.5">Transaction History</h3>
                            <p className="text-xs text-gray-400">
                                {trendTransactions.length} records in {transaction.neighborhood}
                            </p>
                        </div>

                        {loadingTrends ? (
                            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dotted border-gray-200">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-primary-600 border-t-transparent"></div>
                                    <span className="text-xs text-gray-400">Loading history...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* ── Mobile card list (< lg) ──────────────────── */}
                                <div className="lg:hidden space-y-3">
                                    {[...trendTransactions]
                                        .sort((a, b) => new Date(b.transaction_date!).getTime() - new Date(a.transaction_date!).getTime())
                                        .map((t) => {
                                            const tPsf = t.price / (t.built_up_sqft || t.land_area_sqft || 1)
                                            return (
                                                <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                                                    {/* Top row: Price + Date */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="text-lg font-black text-primary-600 leading-tight">
                                                                {formatPriceFull(t.price)}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 mt-0.5">RM {tPsf.toFixed(0)} psf</p>
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                                            {formatDate(t.transaction_date)}
                                                        </span>
                                                    </div>
                                                    {/* Bottom row: meta chips */}
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {t.built_up_sqft && (
                                                            <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                                                {Number(t.built_up_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft
                                                            </span>
                                                        )}
                                                        {t.property_type && (
                                                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">
                                                                {t.property_type.toLowerCase()}
                                                            </span>
                                                        )}
                                                        {t.tenure && (
                                                            <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded uppercase">
                                                                {t.tenure}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    }
                                </div>

                                {/* ── Desktop table (≥ lg) ─────────────────────── */}
                                <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-200">
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
                                            {[...trendTransactions]
                                                .sort((a, b) => new Date(b.transaction_date!).getTime() - new Date(a.transaction_date!).getTime())
                                                .map((t) => {
                                                    const tPsf = t.price / (t.built_up_sqft || t.land_area_sqft || 1)
                                                    return (
                                                        <tr key={t.id} className="bg-white hover:bg-gray-50/80 transition-colors">
                                                            <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                                                            <td className="px-4 py-3 text-right font-semibold text-primary-600 whitespace-nowrap">{formatPriceFull(t.price)}</td>
                                                            <td className="px-4 py-3 text-right text-gray-500 whitespace-nowrap">RM {tPsf.toFixed(0)}</td>
                                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.built_up_sqft ? `${Number(t.built_up_sqft).toLocaleString(undefined, { maximumFractionDigits: 0 })} sqft` : '-'}</td>
                                                            <td className="px-4 py-3 text-gray-600 capitalize whitespace-nowrap">{t.property_type?.toLowerCase() || '-'}</td>
                                                            <td className="px-4 py-3 text-gray-500 text-xs uppercase whitespace-nowrap">{t.tenure || '-'}</td>
                                                        </tr>
                                                    )
                                                })
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                ) : null}
            </div >

            {/* ── Full-screen Chart Modal (portal, escapes the drawer's stacking context) ── */}
            {selectedChartType && (
                <ChartModal
                    isOpen={selectedChartType !== null}
                    onClose={closeChart}
                    transactions={trendTransactions}
                    address={transaction.address || 'Transaction Details'}
                    chartType={selectedChartType}
                />
            )}
        </div >
    )
}
