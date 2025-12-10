import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Property {
    id: string
    title: string
    description: string
    price: number
    location: string
    property_type: 'Condo' | 'Landed' | 'Commercial' | 'Apartment'
    bedrooms: number
    bathrooms: number
    built_up_size: number
    tenure: 'Freehold' | 'Leasehold' | '99 years'
    furnishing: 'Fully Furnished' | 'Partially Furnished' | 'Unfurnished'
    images: string[]
    status: 'active' | 'draft'
    agent_id: string
    created_at: string
    updated_at: string
}

export interface Agent {
    id: string
    user_id: string
    name: string
    phone: string
    whatsapp: string
    profile_photo: string | null
    credits_balance: number
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    email: string
    user_type: 'buyer' | 'agent'
    created_at: string
}
