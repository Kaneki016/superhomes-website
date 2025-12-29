import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types - Updated to match PropertyGuru scraping schema
export interface Property {
    id: string
    listing_id: string
    listing_url: string
    agent_id: string
    property_name: string
    address: string
    state?: string | null // Malaysian state extracted from address
    price: number
    price_per_sqft: number | null
    bedrooms: number
    bedrooms_num?: number | null // Correctly parsed integer bedroom count
    bathrooms: number
    size: string // e.g., "1,400 sqft"
    property_type: string // e.g., "2-storey Terraced House"
    tenure: string // e.g., "Freehold"
    built_year: string | null
    listed_date: string | null
    furnishing: string | null // "Unfurnished", "Partially Furnished", "Fully Furnished"
    description: string | null
    facilities: {
        amenities: string[]
        common_facilities: string[]
    } | null
    images: string[]
    image_count: number
    main_image_url: string | null
    latitude: number | null // For map display
    longitude: number | null // For map display
    source: string // e.g., "propertyguru"
    category: 'buy' | 'rent' | 'new_projects' // Property category
    scraped_at: string
    created_at: string
    updated_at: string
}

export interface Agent {
    id: string
    auth_id?: string | null // Supabase Auth ID - only set when agent registers/claims profile
    agent_id: string // PropertyGuru agent ID or generated ID for new registrations
    name: string
    phone: string | null
    email: string | null
    agency: string | null
    photo_url: string | null
    whatsapp_link: string | null
    profile_url: string | null
    created_at: string
    updated_at: string
}

export interface Buyer {
    id: string
    auth_id: string // Supabase Auth ID
    email: string
    name?: string | null
    phone?: string | null
    created_at: string
    updated_at: string
}

export interface Favorite {
    id: string
    buyer_id: string // References buyers table
    property_id: string
    created_at: string
}

