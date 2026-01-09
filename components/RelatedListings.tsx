import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Property } from '@/lib/supabase'

interface RelatedListingsProps {
    neighborhoods: string[]
}

export default async function RelatedListings({ neighborhoods }: RelatedListingsProps) {
    if (!neighborhoods || neighborhoods.length === 0) {
        return null
    }

    // Build query: find listings where district matches any of the neighborhoods
    // OR address contains the neighborhood name.
    // Since Supabase JS 'in' only works for exact matches, we start with that.

    // Note: This is an OR logic approximation. 
    // Ideally we'd use textSearch but let's stick to safe filters.
    // For now we'll match 'district' exactly against the list.

    const { data: listings } = await supabase
        .from('listings')
        .select(`
            *,
            sale_details(*),
            rent_details(*)
        `)
        .in('district', neighborhoods)
        .limit(6)

    if (!listings || listings.length === 0) {
        return null
    }

    const typedListings = listings as unknown as Property[]

    return (
        <div className="py-12 bg-white border-t border-gray-100">
            <h3 className="text-2xl font-bold font-heading text-gray-900 mb-8 border-l-4 border-rose-600 pl-4">
                Properties Available in These Neighborhoods
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                {typedListings.map((listing) => {
                    // Determine price and size label based on type
                    const isSale = listing.listing_type === 'sale'
                    const price = isSale
                        ? listing.sale_details?.price
                        : listing.rent_details?.monthly_rent
                    const priceLabel = price
                        ? (isSale ? `RM ${price.toLocaleString()}` : `RM ${price.toLocaleString()}/mo`)
                        : 'Price on Ask'

                    const size = listing.floor_area_sqft
                        ? `${listing.floor_area_sqft} sqft`
                        : null

                    const link = isSale ? `/buy/${listing.id}` : `/rent/${listing.id}`

                    return (
                        <Link
                            key={listing.id}
                            href={link}
                            className="bg-white group rounded-xl shadow-sm hover:shadow-lg border border-gray-100 overflow-hidden transition-all flex flex-col"
                        >
                            <div className="relative h-48 bg-gray-200">
                                {listing.main_image_url ? (
                                    <Image
                                        src={listing.main_image_url}
                                        alt={listing.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full text-gray-400">
                                        No Image
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                    {listing.property_type || 'Property'}
                                </div>
                                <div className="absolute bottom-2 left-2 bg-rose-600 text-white text-xs px-2 py-1 rounded font-bold">
                                    {isSale ? 'FOR SALE' : 'FOR RENT'}
                                </div>
                            </div>

                            <div className="p-4 flex flex-col flex-1">
                                <h4 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-rose-600 transition-colors">
                                    {listing.title}
                                </h4>
                                <div className="text-sm text-gray-500 mb-3 truncate">
                                    {listing.address || listing.district}
                                </div>

                                <div className="mt-auto flex items-center justify-between">
                                    <span className="text-lg font-bold text-rose-600">
                                        {priceLabel}
                                    </span>
                                    {size && (
                                        <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                            {size}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Links to view all */}
            <div className="flex flex-wrap gap-4">
                {neighborhoods.map(neighborhood => (
                    <Link
                        key={neighborhood}
                        href={`/buy?search=${encodeURIComponent(neighborhood)}`}
                        className="inline-flex items-center text-sm font-medium text-rose-600 hover:text-rose-700 hover:underline"
                    >
                        View all listings in {neighborhood} →
                    </Link>
                ))}
            </div>
        </div>
    )
}
