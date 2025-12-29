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
        // For single keyword, use standard OR search across fields
        if (words.length === 1) {
            const searchTerm = words[0]
            const { data, error } = await supabase
                .from('dup_properties')
                .select('id, property_name, address, state, property_type, price')
                .or(`property_name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%,property_type.ilike.%${searchTerm}%`)
                .limit(limit)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error searching properties:', error)
                return NextResponse.json([])
            }

            return NextResponse.json(data || [])
        }

        // For multiple keywords, fetch more candidates and filter client-side
        // This ensures ALL keywords are matched across any combination of fields
        const firstWord = words[0]
        const { data, error } = await supabase
            .from('dup_properties')
            .select('id, property_name, address, state, property_type, price')
            .or(`property_name.ilike.%${firstWord}%,address.ilike.%${firstWord}%,state.ilike.%${firstWord}%,property_type.ilike.%${firstWord}%`)
            .limit(100) // Fetch more candidates for filtering
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error searching properties:', error)
            return NextResponse.json([])
        }

        if (!data || data.length === 0) {
            return NextResponse.json([])
        }

        // Filter properties that match ALL keywords across any field
        const filteredResults = data.filter(property => {
            // Combine all searchable fields into one string
            const combinedText = [
                property.property_name || '',
                property.address || '',
                property.state || '',
                property.property_type || ''
            ].join(' ').toLowerCase()

            // Check if ALL keywords are present in the combined text
            return words.every(word => combinedText.includes(word))
        })

        return NextResponse.json(filteredResults.slice(0, limit))
    } catch (error) {
        console.error('Search API error:', error)
        return NextResponse.json([])
    }
}
