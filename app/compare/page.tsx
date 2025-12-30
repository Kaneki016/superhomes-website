'use client'

import { useCompare } from '@/contexts/CompareContext'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ComparePage() {
    const { compareList, removeFromCompare, clearCompare } = useCompare()

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
        }).format(price)
    }

    const calculatePSF = (price: number, size: string) => {
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
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left p-4 font-semibold text-gray-700 w-40">Property</th>
                                    {compareList.map(property => (
                                        <th key={property.id} className="p-4 min-w-[280px]">
                                            <div className="relative">
                                                <button
                                                    onClick={() => removeFromCompare(property.id)}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full hover:bg-red-200 transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <Link href={`/properties/${property.id}`} className="block">
                                                    <img
                                                        src={property.main_image_url || property.images?.[0] || '/placeholder-property.jpg'}
                                                        alt={property.property_name}
                                                        className="w-full h-40 object-cover rounded-lg mb-3"
                                                    />
                                                    <h3 className="font-semibold text-gray-900 text-sm truncate hover:text-primary-600">
                                                        {property.property_name}
                                                    </h3>
                                                </Link>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Price */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Price</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center">
                                            <span className="text-xl font-bold text-primary-600">
                                                {formatPrice(property.price)}
                                            </span>
                                        </td>
                                    ))}
                                </tr>

                                {/* PSF */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Price/sqft</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {calculatePSF(property.price, property.size)}
                                        </td>
                                    ))}
                                </tr>

                                {/* Size */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Size</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {property.size || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* Bedrooms */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Bedrooms</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {property.bedrooms_num || property.bedrooms || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* Bathrooms */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Bathrooms</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {property.bathrooms || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* Property Type */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Type</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {property.property_type || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* Tenure */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Tenure</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {property.tenure || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* Location */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Location</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-600 text-sm">
                                            {property.state || property.address?.split(',').slice(-1)[0] || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* Furnishing */}
                                <tr>
                                    <td className="p-4 font-medium text-gray-700 bg-gray-50">Furnishing</td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center text-gray-900">
                                            {property.furnishing || '-'}
                                        </td>
                                    ))}
                                </tr>

                                {/* View Property Link */}
                                <tr>
                                    <td className="p-4 bg-gray-50"></td>
                                    {compareList.map(property => (
                                        <td key={property.id} className="p-4 text-center">
                                            <Link
                                                href={`/properties/${property.id}`}
                                                className="btn-primary py-2 px-4 text-sm"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    )
}
