import { NextRequest, NextResponse } from 'next/server'
import { getPropertiesPaginated } from '@/lib/database'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!keyword || keyword.trim().length < 2) {
        return NextResponse.json([])
    }

    try {
        // Use the centralized database function which handles multi-word search
        // against title, address, state, and property_type
        const { properties } = await getPropertiesPaginated(1, limit, {
            location: keyword
        })

        if (!properties || properties.length === 0) {
            return NextResponse.json([])
        }

        // Map logic to match original API response structure
        const results = properties.map((item) => {
            return {
                id: item.id,
                property_name: item.title, // Map title to property_name
                address: item.address,
                state: item.state,
                property_type: item.property_type,
                price: item.price || 0
            }
        })

        return NextResponse.json(results)
    } catch (error) {
        console.error('Search API error:', error)
        return NextResponse.json([])
    }
}
