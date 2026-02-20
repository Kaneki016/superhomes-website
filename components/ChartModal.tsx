'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, TrendingUp, BarChart2, LineChart } from 'lucide-react'
import TrendChart, { ChartType } from './TrendChart'
import { Transaction } from '@/lib/types'

interface ChartModalProps {
    isOpen: boolean
    onClose: () => void
    transactions: Transaction[]
    address: string
    chartType: ChartType
}

const chartMeta: Record<ChartType, {
    title: string
    subtitle: string
    icon: React.ReactNode
    accentColor: string
}> = {
    price: {
        title: 'Price Analysis',
        subtitle: 'Average vs Median transaction price over time',
        icon: <TrendingUp size={18} />,
        accentColor: 'text-blue-600 bg-blue-50',
    },
    psf: {
        title: 'PSF Analysis',
        subtitle: 'Price per square foot performance over time',
        icon: <LineChart size={18} />,
        accentColor: 'text-purple-600 bg-purple-50',
    },
    volume: {
        title: 'Market Activity',
        subtitle: 'Transaction volume by property type',
        icon: <BarChart2 size={18} />,
        accentColor: 'text-emerald-600 bg-emerald-50',
    },
}

export default function ChartModal({ isOpen, onClose, transactions, address, chartType }: ChartModalProps) {
    const portalRoot = typeof document !== 'undefined' ? document.body : null
    const meta = chartMeta[chartType]

    // Lock body scroll while modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    if (!portalRoot) return null

    return createPortal(
        <>
            {/* ── Backdrop ─────────────────────────────────────── */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
            />

            {/* ── Modal sheet ───────────────────────────────────── */}
            {/* Mobile: full-height sheet from bottom
                Desktop: centered card                             */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={meta.title}
                className={`fixed z-[3001] bg-white shadow-2xl transition-all duration-300 ease-out
                    inset-x-0 bottom-0 rounded-t-3xl max-h-[95dvh]
                    lg:inset-0 lg:m-auto lg:rounded-2xl lg:max-h-[88vh] lg:w-[860px] lg:h-auto
                    flex flex-col overflow-hidden
                    ${isOpen
                        ? 'translate-y-0 lg:scale-100 opacity-100'
                        : 'translate-y-full lg:translate-y-0 lg:scale-95 opacity-0 pointer-events-none'
                    }`}
            >
                {/* Drag handle (mobile only) */}
                <div className="lg:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 flex-shrink-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.accentColor}`}>
                        {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-gray-900 text-sm leading-tight">{meta.title}</h2>
                        <p className="text-[11px] text-gray-400 truncate">{meta.subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
                        aria-label="Close chart"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Property address sub-header */}
                <div className="px-5 py-2 bg-gray-50/70 border-b border-gray-100 flex-shrink-0">
                    <p className="text-[11px] text-gray-500 truncate">📍 {address}</p>
                </div>

                {/* Scrollable chart area */}
                <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4">
                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <p className="text-sm">No data available.</p>
                        </div>
                    ) : (
                        <TrendChart
                            transactions={transactions}
                            minimal={false}
                            chartType={chartType}
                            className=""
                        />
                    )}
                </div>
            </div>
        </>,
        portalRoot
    )
}
