'use client'

import { useCompare } from '@/contexts/CompareContext'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { formatPrice, formatPricePerSqft } from '@/lib/utils'
import { generatePropertyUrl } from '@/lib/slugUtils'
import ComparisonTable from '@/components/ComparisonTable'

export default function ComparePage() {
    const { compareList, removeFromCompare, clearCompare } = useCompare()

    const calculatePSF = (price: number | null | undefined, size: string | null | undefined) => {
        if (!price || !size) return '-'
        const sizeNum = parseInt(size?.replace(/[^0-9]/g, '') || '0')
        if (!sizeNum || sizeNum === 0) return '-'
        return `RM ${Math.round(price / sizeNum).toLocaleString()}`
    }

    if (compareList.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container-custom py-20">
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 flex items-center justify-center">
                            <svg className="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">No Properties to Compare</h1>
                        <p className="text-gray-600 mb-6">Add properties to compare by clicking the compare icon on property cards.</p>
                        <Link href="/properties" className="btn-primary">
                            Browse Properties
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container-custom py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Compare Properties</h1>
                        <p className="text-gray-600 mt-1">Comparing {compareList.length} properties</p>
                    </div>
                    <button
                        onClick={clearCompare}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Clear All
                    </button>
                </div>

                {/* Comparison Table */}
                <div className="glass rounded-2xl overflow-hidden shadow-sm">
                    <ComparisonTable />
                </div>
            </div>
            <Footer />
        </div>
    )
}
