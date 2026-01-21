import { X, Check, Minus } from 'lucide-react'
import { Property, Transaction } from '@/lib/supabase'
import { formatPriceFull } from '@/lib/utils'

interface ComparisonModalProps {
    items: (Property | Transaction)[]
    isOpen: boolean
    onClose: () => void
    onRemove: (id: string) => void
}

// Helper to normalize data for comparison
// Helper to normalize data for comparison
const normalizeData = (item: Property | Transaction) => {
    // Safe casting/access
    const anyItem = item as any

    // Title/Name
    const title = anyItem.title || anyItem.property_name || anyItem.project_name || anyItem.name || 'Unknown Property'

    // Address
    const address = anyItem.address || anyItem.road_name || anyItem.district || '-'

    // Price
    const price = anyItem.price || anyItem.transacted_price || 0

    // Size (Handle string "1,200 sqft" or number 1200)
    let size = 0
    if (anyItem.floor_area_sqft) {
        size = typeof anyItem.floor_area_sqft === 'string'
            ? parseFloat(anyItem.floor_area_sqft.replace(/,/g, '').replace(/[^\d.]/g, ''))
            : anyItem.floor_area_sqft
    } else if (anyItem.built_up_sqft) {
        size = Number(anyItem.built_up_sqft)
    } else if (anyItem.land_area_sqft) {
        size = Number(anyItem.land_area_sqft)
    } else if (anyItem.size) { // Some legacy mapping
        size = typeof anyItem.size === 'string'
            ? parseFloat(anyItem.size.replace(/,/g, '').replace(/[^\d.]/g, ''))
            : anyItem.size
    }

    // PSF
    const psf = size > 0 && price > 0 ? price / size : (anyItem.price_per_sqft || 0)

    // Bedrooms & Bathrooms
    const bedrooms = anyItem.bedrooms_num || anyItem.total_bedrooms || anyItem.bedrooms || '-'
    const bathrooms = anyItem.bathrooms || anyItem.total_bathrooms || '-'

    return {
        id: anyItem.id,
        type: 'listing_type' in item ? (item.listing_type === 'rent' ? 'Rent' : 'Sale') : 'Sold',
        title: title,
        price: price,
        psf: psf,
        address: address,
        propertyType: anyItem.property_type || '-',
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        size: size,
        tenure: anyItem.tenure || '-',
        year: anyItem.year_built || anyItem.transacted_year || '-',
    }
}

export default function ComparisonModal({ items, isOpen, onClose, onRemove }: ComparisonModalProps) {
    if (!isOpen) return null

    const normalizedItems = items.map(normalizeData)

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Property Comparison
                        <span className="bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">{items.length} Items</span>
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Table Area */}
                <div className="flex-grow overflow-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="p-4 bg-gray-50 min-w-[200px] sticky left-0 z-20 font-semibold text-gray-500 uppercase tracking-wider text-xs">
                                    Feature
                                </th>
                                {normalizedItems.map(item => (
                                    <th key={item.id} className="p-4 min-w-[280px] align-top relative group">
                                        <div className="flex justify-between items-start">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block ${item.type === 'Sale' ? 'bg-blue-100 text-blue-700' :
                                                item.type === 'Rent' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {item.type}
                                            </span>
                                            <button
                                                onClick={() => onRemove(item.id)}
                                                className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                                title="Remove"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        <div className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 mb-1">
                                            {item.title}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Price */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Price</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-lg font-bold text-gray-900">
                                        {formatPriceFull(item.price)}
                                        {item.type === 'Rent' && <span className="text-xs font-normal text-gray-500 ml-1">/mo</span>}
                                    </td>
                                ))}
                            </tr>
                            {/* PSF */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Price PSF</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600">
                                        {item.psf > 0 ? `RM ${item.psf.toFixed(0)} psf` : '-'}
                                    </td>
                                ))}
                            </tr>
                            {/* Location */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Location</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600 leading-relaxed">
                                        {item.address}
                                    </td>
                                ))}
                            </tr>
                            {/* Property Type */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Type</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600 capitalize">
                                        {item.propertyType}
                                    </td>
                                ))}
                            </tr>
                            {/* Size */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Size</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600">
                                        {item.size ? `${item.size.toLocaleString()} sqft` : '-'}
                                    </td>
                                ))}
                            </tr>
                            {/* Bedrooms */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Bedrooms</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600">
                                        {item.bedrooms}
                                    </td>
                                ))}
                            </tr>
                            {/* Bathrooms */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Bathrooms</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600">
                                        {item.bathrooms}
                                    </td>
                                ))}
                            </tr>
                            {/* Tenure */}
                            <tr>
                                <td className="p-4 bg-gray-50 sticky left-0 font-medium text-gray-700">Tenure</td>
                                {normalizedItems.map(item => (
                                    <td key={item.id} className="p-4 text-gray-600 capitalize">
                                        {item.tenure}
                                    </td>
                                ))}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
