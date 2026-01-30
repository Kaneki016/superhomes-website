'use server'

import { auth } from '@/lib/auth'
import sql from '@/lib/db'

export async function getFavorites() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        // Need to find buyer id first.
        // Assuming profile linkage is correct.
        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${session.user.id}`

        if (!buyer) return []

        const favorites = await sql`
            SELECT property_id FROM favorites WHERE buyer_id = ${buyer.id}
        `
        return favorites.map(f => f.property_id)
    } catch (error) {
        console.error('getFavorites error:', error)
        return []
    }
}

export async function addFavorite(propertyId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    try {
        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${session.user.id}`
        if (!buyer) return { success: false, error: 'Profile not found' }

        await sql`
            INSERT INTO favorites (buyer_id, property_id)
            VALUES (${buyer.id}, ${propertyId})
            ON CONFLICT DO NOTHING
        `
        return { success: true }
    } catch (error: any) {
        console.error('addFavorite error:', error)
        return { success: false, error: error.message }
    }
}

export async function removeFavorite(propertyId: string) {
    const session = await auth()
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' }

    try {
        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${session.user.id}`
        if (!buyer) return { success: false, error: 'Profile not found' }

        await sql`
            DELETE FROM favorites 
            WHERE buyer_id = ${buyer.id} AND property_id = ${propertyId}
        `
        return { success: true }
    } catch (error: any) {
        console.error('removeFavorite error:', error)
        return { success: false, error: error.message }
    }
}

export async function getFavoriteProperties() {
    const session = await auth()
    if (!session?.user?.id) return []

    try {
        const [buyer] = await sql`SELECT id FROM buyers WHERE auth_id = ${session.user.id}`
        if (!buyer) return []

        // Fetch properties joined with details
        // Note: Using raw SQL joining might be complex if we need exact structure matching Supabase response
        // But we can approximate.
        // Or fetch IDs and then fetch properties.

        // Let's do a JOIN
        const properties = await sql`
            SELECT 
                l.*,
                ls.price as sale_price, ls.price_per_sqft as sale_pps,
                lr.monthly_rent as rent_price
            FROM favorites f
            JOIN listings l ON f.property_id = l.id
            LEFT JOIN listing_sale_details ls ON l.id = ls.listing_id
            LEFT JOIN listing_rent_details lr ON l.id = lr.listing_id
            WHERE f.buyer_id = ${buyer.id}
            ORDER BY f.created_at DESC
        `

        // Map to Property interface shape (partially)
        return properties.map(p => ({
            ...p,
            price: p.sale_price || p.rent_price,
            price_per_sqft: p.sale_pps,
            // Reconstruct nested objects if needed by frontend
            sale_details: p.sale_price ? { price: p.sale_price, price_per_sqft: p.sale_pps } : null,
            rent_details: p.rent_price ? { monthly_rent: p.rent_price } : null
        }))

    } catch (error) {
        console.error('getFavoriteProperties error:', error)
        return []
    }
}
