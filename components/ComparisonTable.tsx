'use client'

import { useCompare } from '@/contexts/CompareContext'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'
import { generatePropertyUrl } from '@/lib/slugUtils'
import { calculateMonthlyRepayment } from '@/lib/mortgage'

export default function ComparisonTable() {
    const { compareList, removeFromCompare } = useCompare()

    const calculatePSF = (price: number | null | undefined, size: string | null | undefined) => {
        if (!price || !size) return '-'
        const sizeNum = parseInt(size?.replace(/[^0-9]/g, '') || '0')
        if (!sizeNum || sizeNum === 0) return '-'
        return `RM ${Math.round(price / sizeNum).toLocaleString()}`
    }

    if (compareList.length === 0) {
        return (
            <div className="text-center py-10">
                <p className="text-gray-500">No items in comparison.</p>
            </div>
        )
    }

    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="text-left p-4 font-semibold text-gray-700 w-40">Property</th>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                const title = isProperty ? (item.title || item.property_name || 'Property') : `Transaction at ${item.address || 'Unknown'}`
                                // Image Removed as per previous request

                                return (
                                    <th key={item.id} className="p-4 min-w-[200px]">
                                        <div className="relative">
                                            <button
                                                onClick={() => removeFromCompare(item.id)}
                                                className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                            {isProperty ? (
                                                <Link href={generatePropertyUrl(item)} className="block">
                                                    <h3 className="font-semibold text-gray-900 text-sm hover:text-primary-600 line-clamp-2 text-left">
                                                        {title}
                                                    </h3>
                                                </Link>
                                            ) : (
                                                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 text-left">
                                                    {title}
                                                </h3>
                                            )}
                                        </div>
                                    </th>
                                )
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Price */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Price</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                return (
                                    <td key={item.id} className="p-4 text-center">
                                        <span className="text-lg font-bold text-primary-600">
                                            {formatPrice(item.price, isProperty ? item.listing_type === 'rent' : false)}
                                        </span>
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Monthly Commitment */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">
                                <div>Monthly Commitment</div>
                                <div className="text-xs text-gray-400 font-normal mt-0.5">
                                    (Est. Mortgage / Rent)
                                </div>
                            </td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                const isRent = isProperty && item.listing_type === 'rent'

                                let monthlyValue = 0
                                let label = ''

                                if (isRent) {
                                    monthlyValue = item.price || 0
                                    label = 'Rental'
                                } else {
                                    // Sale or Transaction -> Calculate Mortgage
                                    monthlyValue = calculateMonthlyRepayment(item.price || 0)
                                    label = 'Est. Mortgage *'
                                }

                                return (
                                    <td key={item.id} className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-lg font-bold text-gray-900">
                                                RM {monthlyValue.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                {label}
                                            </span>
                                        </div>
                                    </td>
                                )
                            })}
                        </tr>

                        {/* PSF */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Price/sqft</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                const size = isProperty ? (item.floor_area_sqft || item.size) : (item.built_up_sqft?.toString() || item.land_area_sqft?.toString())
                                return (
                                    <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                        {calculatePSF(item.price, size)}
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Size */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Size</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                const size = isProperty ? (item.floor_area_sqft || item.size) : (item.built_up_sqft?.toString() || item.land_area_sqft?.toString())
                                return (
                                    <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                        {size || '-'} sqft
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Bedrooms */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Bedrooms</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                return (
                                    <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                        {isProperty ? (item.total_bedrooms || item.bedrooms_num || item.bedrooms || '-') : '-'}
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Bathrooms */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Bathrooms</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                return (
                                    <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                        {isProperty ? (item.bathrooms || '-') : '-'}
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Property Type */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Type</td>
                            {compareList.map(item => (
                                <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                    {item.property_type || '-'}
                                </td>
                            ))}
                        </tr>

                        {/* Tenure */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Tenure</td>
                            {compareList.map(item => (
                                <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                    {item.tenure || '-'}
                                </td>
                            ))}
                        </tr>

                        {/* Location */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Location</td>
                            {compareList.map(item => {
                                const location = 'state' in item ? item.state : null
                                return (
                                    <td key={item.id} className="p-4 text-center text-gray-600 text-sm">
                                        {item.district || location || item.address?.split(',').slice(-1)[0] || '-'}
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Furnishing */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Furnishing</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                return (
                                    <td key={item.id} className="p-4 text-center text-gray-900 text-sm">
                                        {isProperty ? (item.furnishing || '-') : '-'}
                                    </td>
                                )
                            })}
                        </tr>

                        {/* Listing Type / Status */}
                        <tr>
                            <td className="p-4 font-medium text-gray-700 bg-gray-50">Status</td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                const date = !isProperty && 'transaction_date' in item ? item.transaction_date : null
                                return (
                                    <td key={item.id} className="p-4 text-center">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${isProperty
                                            ? (item.listing_type === 'sale' ? 'bg-green-100 text-green-700' :
                                                item.listing_type === 'rent' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-purple-100 text-purple-700')
                                            : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {isProperty
                                                ? (item.listing_type === 'sale' ? 'For Sale' :
                                                    item.listing_type === 'rent' ? 'For Rent' : 'New Project')
                                                : `Sold ${date ? `on ${date}` : ''}`}
                                        </span>
                                    </td>
                                )
                            })}
                        </tr>

                        {/* View Property Link */}
                        <tr>
                            <td className="p-4 bg-gray-50"></td>
                            {compareList.map(item => {
                                const isProperty = 'listing_type' in item
                                return (
                                    <td key={item.id} className="p-4 text-center">
                                        {isProperty ? (
                                            <Link
                                                href={generatePropertyUrl(item)}
                                                className="btn-primary py-2 px-4 text-sm"
                                            >
                                                View Details
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">Historical Data</span>
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center italic">
                * Estimated mortgage based on 90% margin of finance, 4% interest rate, and 35-year tenure.
            </p>
        </>
    )
}
