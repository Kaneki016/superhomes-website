'use client'

import { useCompare } from '@/contexts/CompareContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CompareBar({ onCompareNow }: { onCompareNow?: () => void }) {
    const { compareList, removeFromCompare, clearCompare } = useCompare()

    const pathname = usePathname()

    // If we are on transaction-map, ONLY show the bar if onCompareNow is provided (Local instance)
    // Hide the global instance (which lacks onCompareNow) on this page to avoid duplicates
    if (pathname === '/transaction-map' && !onCompareNow) return null

    if (compareList.length === 0) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200 shadow-lg">
            <div className="container-custom py-4">
                <div className="flex items-center justify-between">
                    {/* Selected Properties */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">
                            Compare ({compareList.length}/3):
                        </span>
                        <div className="flex items-center gap-3">
                            {compareList.map((item) => {
                                const isProperty = 'listing_type' in item
                                const title = isProperty ? (item.title || item.property_name || 'Property') : `Transaction at ${item.address || 'Unknown'}`

                                const price = isProperty ? item.price : item.price

                                return (
                                    <div
                                        key={item.id}
                                        className="relative group flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2"
                                    >
                                        {/* Name */}
                                        <div className="hidden sm:block max-w-[120px]">
                                            <p className="text-sm font-medium text-gray-900 truncate" title={title}>
                                                {title}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {price ? `RM ${(price / 1000000).toFixed(2)}M` : 'POA'}
                                            </p>
                                        </div>
                                        {/* Remove button */}
                                        <button
                                            onClick={() => removeFromCompare(item.id)}
                                            className="ml-1 p-1 rounded-full hover:bg-gray-200 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )
                            })}

                            {/* Empty slots */}
                            {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                                <div
                                    key={`empty-${i}`}
                                    className="w-10 h-10 rounded border-2 border-dashed border-gray-300 flex items-center justify-center"
                                >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={clearCompare}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Clear All
                        </button>
                        {onCompareNow ? (
                            <button
                                onClick={onCompareNow}
                                disabled={compareList.length < 2}
                                className={`btn-primary py-2 px-4 text-sm ${compareList.length < 2 ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                Compare Now
                            </button>
                        ) : (
                            <Link
                                href="/compare"
                                className={`btn-primary py-2 px-4 text-sm ${compareList.length < 2 ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                Compare Now
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
