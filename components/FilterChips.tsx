'use client'
import { trackToggle } from '@/lib/gtag'

interface FilterChip {
    key: string
    label: string
    value: string
}

interface FilterChipsProps {
    filters: FilterChip[]
    onRemove: (key: string) => void
    onClearAll: () => void
}

export default function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
    if (filters.length === 0) return null

    return (
        <div className="flex flex-wrap items-center gap-2 mb-6 animate-slide-up">
            <span className="text-sm text-gray-600 font-medium">Active Filters:</span>

            {filters.map((filter) => (
                <div
                    key={filter.key}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-full text-sm font-medium transition-all hover:bg-primary-100 hover:border-primary-300"
                >
                    <span>{filter.label}: {filter.value}</span>
                    <button
                        onClick={() => {
                            trackToggle(`Filter Chip - ${filter.label}`, false, 'Filter')
                            onRemove(filter.key)
                        }}
                        className="hover:text-primary-900 transition-colors"
                        aria-label={`Remove ${filter.label} filter`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}

            {filters.length > 1 && (
                <button
                    onClick={() => {
                        trackToggle('Clear All Filters', false, 'Filter')
                        onClearAll()
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700 underline font-medium transition-colors"
                >
                    Clear All
                </button>
            )}
        </div>
    )
}
