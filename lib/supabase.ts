import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// NEW SCHEMA TYPES - Multi-Table Listings
// ============================================

// Base listing type - shared fields for all listing types
export interface Listing {
    id: string                    // UUID
    listing_url: string
    listing_type: 'sale' | 'rent' | 'project'
    title: string
    scraped_at: string
    updated_at: string
    description: string | null
    address: string | null
    district: string | null
    state: string | null
    postcode: string | null
    latitude: number | null
    longitude: number | null
    property_type: string | null
    bedrooms: string | null
    bathrooms: string | null
    car_parks: string | null
    floor_area_sqft: string | null
    land_area_sqft: string | null
    images: string[] | null
    furnishing: string | null
    is_active: boolean
    image_count: number | null
    main_image_url: string | null
    facilities: {
        amenities: string[]
        common_facilities: string[]
    } | null
    listing_id: string | null     // PropertyGuru listing ID
    total_bedrooms: number | null
    bedrooms_main: number | null
    bedrooms_additional: number | null
}

// Sale-specific details
export interface ListingSaleDetails {
    listing_id: string            // FK to listings.id
    created_at: string
    updated_at: string
    price: number | null
    price_per_sqft: number | null
    tenure: string | null
    year_built: string | null
    listing_date: string | null
}

// Rent-specific details
export interface ListingRentDetails {
    listing_id: string            // FK to listings.id
    created_at: string
    updated_at: string
    monthly_rent: number | null
    deposit_months: number | null
    available_from: string | null
    min_lease_months: number | null
    utilities_included: boolean
    listing_date: string | null
}

// Project-specific details
export interface ListingProjectDetails {
    listing_id: string            // FK to listings.id
    created_at: string
    updated_at: string
    launch_date: string | null
    expected_completion: string | null
    total_units: number | null
    blocks: number | null
    storeys: number | null
    unit_types: string[] | null
    status: string | null
}

// Contact (agent/developer) - replaces Agent
export interface Contact {
    id: string
    profile_url: string | null
    contact_type: 'agent' | 'developer'
    name: string
    scraped_at: string
    updated_at: string
    phone: string | null
    email: string | null
    whatsapp_url: string | null
    company_name: string | null
    company_logo_url: string | null
    bio: string | null
    agency_reg_no: string | null
    photo_url: string | null
    ren_number: string | null
    listings_for_sale_count: number | null
    listings_for_rent_count: number | null
    address: string | null
}

// Junction table for listing-contact relationship
export interface ListingContact {
    id: string
    listing_id: string
    contact_id: string
    linked_at: string
    contact_role: string | null
}

// Unified type for components (combines base + type-specific details + contacts)
// This is the main type used throughout the application
export interface Property {
    // Base listing fields
    id: string
    listing_url: string
    listing_type: 'sale' | 'rent' | 'project'
    title: string
    scraped_at: string
    updated_at: string
    created_at?: string
    description: string | null
    address: string | null
    district: string | null
    state: string | null
    postcode: string | null
    latitude: number | null
    longitude: number | null
    property_type: string | null
    bedrooms: string | null
    bathrooms: string | null
    car_parks: string | null
    floor_area_sqft: string | null
    land_area_sqft: string | null
    images: string[] | null
    furnishing: string | null
    is_active: boolean
    image_count: number | null
    main_image_url: string | null
    facilities: {
        amenities: string[]
        common_facilities: string[]
    } | null
    listing_id: string | null
    total_bedrooms: number | null
    bedrooms_main: number | null
    bedrooms_additional: number | null

    // Computed/mapped fields for backward compatibility
    property_name?: string        // Maps to title
    price?: number | null         // From sale_details.price or rent_details.monthly_rent
    price_per_sqft?: number | null
    size?: string                 // Maps to floor_area_sqft
    tenure?: string | null        // From sale_details.tenure
    built_year?: string | null    // From sale_details.year_built
    listed_date?: string | null   // From type-specific listing_date
    bedrooms_num?: number | null  // Maps to total_bedrooms
    source?: string
    category?: 'buy' | 'rent' | 'new_projects'
    agent_id?: string             // Primary contact ID

    // Type-specific details (populated based on listing_type)
    sale_details?: ListingSaleDetails | null
    rent_details?: ListingRentDetails | null
    project_details?: ListingProjectDetails | null

    // Associated contacts
    contacts?: Contact[]
}

// Agent type - alias for Contact for backward compatibility
export type Agent = Contact & {
    // Additional fields for backward compatibility
    auth_id?: string | null
    agent_id?: string            // Maps to id or profile reference
    agency?: string | null       // Maps to company_name
    whatsapp_link?: string | null // Maps to whatsapp_url
    created_at?: string          // Maps to scraped_at
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

// ============================================
// DEPRECATED - OLD SCHEMA TYPES (Keep for reference)
// ============================================

/*
// Database Types - Old PropertyGuru scraping schema
export interface Property_Old {
    id: string
    listing_id: string
    listing_url: string
    agent_id: string
    property_name: string
    address: string
    state?: string | null
    price: number
    price_per_sqft: number | null
    bedrooms: number
    bedrooms_num?: number | null
    bathrooms: number
    size: string
    property_type: string
    tenure: string
    built_year: string | null
    listed_date: string | null
    furnishing: string | null
    description: string | null
    facilities: {
        amenities: string[]
        common_facilities: string[]
    } | null
    images: string[]
    image_count: number
    main_image_url: string | null
    latitude: number | null
    longitude: number | null
    source: string
    category: 'buy' | 'rent' | 'new_projects'
    scraped_at: string
    created_at: string
    updated_at: string
}

export interface Agent_Old {
    id: string
    auth_id?: string | null
    agent_id: string
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
*/
