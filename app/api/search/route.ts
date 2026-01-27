import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Common words to filter out from search queries
const STOPWORDS = new Set([
    'in', 'at', 'on', 'for', 'to', 'with', 'and', 'or', 'the', 'a', 'an',
    'near', 'around', 'by', 'from', 'of', 'is', 'are', 'was', 'were'
])

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!keyword || keyword.trim().length < 2) {
        return NextResponse.json([])
    }

    // Split into words and filter out stopwords
    const words = keyword
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length >= 2 && !STOPWORDS.has(word))

    if (words.length === 0) {
        return NextResponse.json([])
    }

    try {
        let query = supabase
            .from('listings')
            .select(`
                id,
                title,
                address,
                state,
                property_type,
                listing_sale_details(price),
                listing_rent_details(monthly_rent),
                listing_project_details(price)
            `)
            .eq('is_active', true)

        // Construct search filter
        if (words.length === 1) {
            const searchTerm = words[0]
            query = query.or(`title.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`)
        } else {
            const firstWord = words[0]
            query = query.or(`title.ilike.%${firstWord}%,address.ilike.%${firstWord}%,state.ilike.%${firstWord}%,property_type.ilike.%${firstWord}%`)
        }

        const { data, error } = await query
            .limit(100)
            .order('scraped_at', { ascending: false })

        if (error) {
            console.error('Error searching properties:', error)
            return NextResponse.json([])
        }

        if (!data || data.length === 0) {
            return NextResponse.json([])
        }

        // Map and filter results
        let results = data.map((item: any) => {
            // Extract price from joined tables
            let price = 0
            if (item.listing_sale_details && item.listing_sale_details.length > 0) {
                price = item.listing_sale_details[0].price
            } else if (item.listing_rent_details && item.listing_rent_details.length > 0) {
                price = item.listing_rent_details[0].monthly_rent
            } else if (item.listing_project_details && item.listing_project_details.length > 0) {
                price = item.listing_project_details[0].price
            }

            return {
                id: item.id,
                property_name: item.title, // Map title to property_name
                address: item.address,
                state: item.state,
                property_type: item.property_type,
                price: price
            }
        })

        // Client-side filtering for multiple keywords (if applicable)
        if (words.length > 1) {
            results = results.filter(property => {
                const combinedText = [
                    property.property_name || '',
                    property.address || '',
                    property.state || '',
                    property.property_type || ''
                ].join(' ').toLowerCase()

                return words.every(word => combinedText.includes(word))
            })
        }

        return NextResponse.json(results.slice(0, limit))
    } catch (error) {
        console.error('Search API error:', error)
        return NextResponse.json([])
    }
}
