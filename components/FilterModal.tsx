'use client'

import { useState, useEffect } from 'react'

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
    tabLabels?: {
        propertyType?: string
        price?: string
        bedroom?: string
        state?: string
    }
}

type TabType = 'propertyType' | 'price' | 'bedroom' | 'state'

export default function FilterModal({ isOpen, onClose, filters, onApply, filterOptions, stateOptions = [], tabLabels }: FilterModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('propertyType')
    const [localFilters, setLocalFilters] = useState(filters)
    const [openPriceDropdown, setOpenPriceDropdown] = useState<'min' | 'max' | null>(null)

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
                        {tabLabels?.propertyType || 'Property Type'}
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
                        {tabLabels?.price || 'Price'}
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
                        {tabLabels?.bedroom || 'Bedroom'}
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
                        {tabLabels?.state || 'State'}
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
                        <div className="space-y-4 min-h-[300px]">
                            {/* Labels Row */}
                            <div className="grid grid-cols-2 gap-4">
                                <label className="text-sm font-medium text-gray-900">Minimum</label>
                                <label className="text-sm font-medium text-gray-900">Maximum</label>
                            </div>

                            {/* Input Fields Row */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Min Price Input */}
                                <div
                                    className={`flex items-center border rounded-lg px-3 py-2.5 bg-white transition-colors ${openPriceDropdown === 'min' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    <span className="text-gray-500 mr-2 text-sm font-medium">RM</span>
                                    <input
                                        type="text"
                                        placeholder="Min"
                                        value={localFilters.minPrice ? parseInt(localFilters.minPrice).toLocaleString() : ''}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/,/g, '').replace(/\D/g, '')
                                            setLocalFilters({ ...localFilters, minPrice: value })
                                        }}
                                        onFocus={() => setOpenPriceDropdown('min')}
                                        className="flex-1 text-gray-700 text-sm bg-transparent outline-none w-full"
                                    />
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform cursor-pointer ${openPriceDropdown === 'min' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        onClick={() => setOpenPriceDropdown(openPriceDropdown === 'min' ? null : 'min')}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {/* Max Price Input */}
                                <div
                                    className={`flex items-center border rounded-lg px-3 py-2.5 bg-white transition-colors ${openPriceDropdown === 'max' ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-300 hover:border-gray-400'}`}
                                >
                                    <span className="text-gray-500 mr-2 text-sm font-medium">RM</span>
                                    <input
                                        type="text"
                                        placeholder="Max"
                                        value={localFilters.maxPrice ? parseInt(localFilters.maxPrice).toLocaleString() : ''}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/,/g, '').replace(/\D/g, '')
                                            setLocalFilters({ ...localFilters, maxPrice: value })
                                        }}
                                        onFocus={() => setOpenPriceDropdown('max')}
                                        className="flex-1 text-gray-700 text-sm bg-transparent outline-none w-full"
                                    />
                                    <svg
                                        className={`w-4 h-4 text-gray-400 transition-transform cursor-pointer ${openPriceDropdown === 'max' ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        onClick={() => setOpenPriceDropdown(openPriceDropdown === 'max' ? null : 'max')}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Min Price Options - shown inline when active */}
                            {openPriceDropdown === 'min' && (
                                <div className="space-y-2">
                                    {[
                                        { label: 'No Min', value: '' },
                                        { label: '200,000', value: '200000' },
                                        { label: '300,000', value: '300000' },
                                        { label: '400,000', value: '400000' },
                                        { label: '500,000', value: '500000' },
                                        { label: '600,000', value: '600000' },
                                        { label: '800,000', value: '800000' },
                                        { label: '1,000,000', value: '1000000' },
                                        { label: '1,500,000', value: '1500000' },
                                        { label: '2,000,000', value: '2000000' },
                                        { label: '3,000,000', value: '3000000' },
                                        { label: '5,000,000', value: '5000000' },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${localFilters.minPrice === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="minPrice"
                                                checked={localFilters.minPrice === opt.value}
                                                onChange={() => {
                                                    setLocalFilters({ ...localFilters, minPrice: opt.value })
                                                    setOpenPriceDropdown(null)
                                                }}
                                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {/* Max Price Options - shown inline when active */}
                            {openPriceDropdown === 'max' && (
                                <div className="space-y-2">
                                    {[
                                        { label: 'No Max', value: '' },
                                        { label: '300,000', value: '300000' },
                                        { label: '400,000', value: '400000' },
                                        { label: '500,000', value: '500000' },
                                        { label: '600,000', value: '600000' },
                                        { label: '800,000', value: '800000' },
                                        { label: '1,000,000', value: '1000000' },
                                        { label: '1,500,000', value: '1500000' },
                                        { label: '2,000,000', value: '2000000' },
                                        { label: '3,000,000', value: '3000000' },
                                        { label: '5,000,000', value: '5000000' },
                                        { label: '10,000,000', value: '10000000' },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${localFilters.maxPrice === opt.value ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50/50'}`}
                                        >
                                            <input
                                                type="radio"
                                                name="maxPrice"
                                                checked={localFilters.maxPrice === opt.value}
                                                onChange={() => {
                                                    setLocalFilters({ ...localFilters, maxPrice: opt.value })
                                                    setOpenPriceDropdown(null)
                                                }}
                                                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                            />
                                            <span className="text-sm text-gray-700">{opt.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
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
