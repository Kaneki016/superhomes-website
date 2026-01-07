'use client'

import { useState, useEffect } from 'react'
import RangeSlider from './RangeSlider'

interface FilterModalProps {
    isOpen: boolean
    onClose: () => void
    filters: {
        propertyType: string
        minPrice: string
        maxPrice: string
        bedrooms: string
        location: string
        state: string
    }
    onApply: (filters: {
        propertyType: string
        minPrice: string
        maxPrice: string
        bedrooms: string
        location: string
        state: string
    }) => void
    filterOptions: {
        propertyTypes: string[]
        bedrooms: number[]
        priceRange: { min: number; max: number }
    }
    stateOptions?: string[] // Dynamic state options from database
}

type TabType = 'propertyType' | 'price' | 'bedroom' | 'state'

export default function FilterModal({ isOpen, onClose, filters, onApply, filterOptions, stateOptions = [] }: FilterModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('propertyType')
    const [localFilters, setLocalFilters] = useState(filters)

    // Sync local filters when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalFilters(filters)
        }
    }, [isOpen, filters])

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleApply = () => {
        onApply(localFilters)
        onClose()
    }

    const handleClear = () => {
        setLocalFilters({
            propertyType: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
            location: '',
            state: '',
        })
    }


    // Bedroom options
    const bedroomOptions = [
        { label: 'Any', value: '' },
        { label: 'Studio', value: '0' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
        { label: '5+', value: '5' },
    ]

    // Property type options
    const propertyTypeOptions = [
        { label: 'All Residential', value: '' },
        ...filterOptions.propertyTypes.map(type => ({ label: type, value: type }))
    ]

    const formatPriceDisplay = (value: string) => {
        if (!value) return ''
        return Number(value).toLocaleString()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
                    <h2 className="text-lg font-semibold">Filters</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('propertyType')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'propertyType'
                            ? 'text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Property Type
                        {activeTab === 'propertyType' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('price')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'price'
                            ? 'text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Price
                        {activeTab === 'price' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('bedroom')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'bedroom'
                            ? 'text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Bedroom
                        {activeTab === 'bedroom' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('state')}
                        className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'state'
                            ? 'text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        State
                        {activeTab === 'state' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Property Type Tab */}
                    {activeTab === 'propertyType' && (
                        <div className="space-y-3">
                            {propertyTypeOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => setLocalFilters({ ...localFilters, propertyType: option.value })}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer transition-all"
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${localFilters.propertyType === option.value
                                        ? 'border-primary-500 bg-primary-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {localFilters.propertyType === option.value && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className="text-gray-700">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Price Tab */}
                    {activeTab === 'price' && (
                        <div className="space-y-6">
                            {/* Min/Max Input Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">RM</span>
                                        <input
                                            type="text"
                                            placeholder="Min"
                                            value={formatPriceDisplay(localFilters.minPrice)}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/,/g, '').replace(/\D/g, '')
                                                setLocalFilters({ ...localFilters, minPrice: value })
                                            }}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Maximum</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">RM</span>
                                        <input
                                            type="text"
                                            placeholder="Max"
                                            value={formatPriceDisplay(localFilters.maxPrice)}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/,/g, '').replace(/\D/g, '')
                                                setLocalFilters({ ...localFilters, maxPrice: value })
                                            }}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Range Slider */}
                            <div className="px-2 pt-2 pb-6">
                                <RangeSlider
                                    min={0}
                                    max={5000000}
                                    step={50000}
                                    value={[
                                        Number(localFilters.minPrice.replace(/,/g, '')) || 0,
                                        Number(localFilters.maxPrice.replace(/,/g, '')) || 5000000
                                    ]}
                                    onChange={([min, max]) => {
                                        setLocalFilters({
                                            ...localFilters,
                                            minPrice: min.toString(),
                                            maxPrice: max.toString()
                                        })
                                    }}
                                />
                                <div className="flex justify-between mt-2 text-xs text-gray-400 font-medium">
                                    <span>RM 0</span>
                                    <span>RM 5M+</span>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* Bedroom Tab */}
                    {activeTab === 'bedroom' && (
                        <div className="space-y-3">
                            {bedroomOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => setLocalFilters({ ...localFilters, bedrooms: option.value })}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer transition-all"
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${localFilters.bedrooms === option.value
                                        ? 'border-primary-500 bg-primary-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {localFilters.bedrooms === option.value && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className="text-gray-700">{option.label} {option.value && option.value !== '0' ? 'Bedroom' + (option.value !== '1' ? 's' : '') : ''}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* State Tab */}
                    {activeTab === 'state' && (
                        <div className="space-y-3">
                            {[
                                { label: 'All States', value: '' },
                                ...stateOptions.map(state => ({ label: state, value: state }))
                            ].map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => setLocalFilters({ ...localFilters, state: option.value })}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer transition-all"
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${localFilters.state === option.value
                                        ? 'border-primary-500 bg-primary-500'
                                        : 'border-gray-300'
                                        }`}>
                                        {localFilters.state === option.value && (
                                            <div className="w-2 h-2 rounded-full bg-white" />
                                        )}
                                    </div>
                                    <span className="text-gray-700">{option.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-gray-200 bg-white">
                    <button
                        onClick={handleClear}
                        className="flex-1 py-3 px-6 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 py-3 px-6 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    )
}
