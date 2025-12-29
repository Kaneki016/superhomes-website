// Script to reset coordinates set by the lookup table and re-run proper geocoding
// Run with: npx tsx scripts/reset-and-regeocode.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    console.log('🔄 Resetting coordinates for properties that need re-geocoding...\n')

    // Find properties that were geocoded today (likely by the lookup table)
    // These will have coordinates but we want to re-geocode them with Nominatim

    // Get properties with approximate coordinates (those added by lookup table)
    // The lookup table adds small random offsets, so they won't be exactly on city centers
    // For safety, let's just reset ALL properties that were updated in the last hour

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Actually, safer approach: Reset all properties to NULL and let the geocoder handle them
    // But that would lose good coordinates. 

    // Better: Find properties where address is known but coords are not precise
    // Let's check for properties that have coords but were recently modified

    const { count, error: countError } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .not('latitude', 'eq', -99)

    if (countError) {
        console.error('Error counting:', countError)
        return
    }

    console.log(`Total properties with coordinates: ${count}`)

    // Reset recently added coordinates (from last script run)
    // Set them to NULL so the geocode script picks them up
    const { data: recentlyModified, error: fetchError } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, latitude, longitude, updated_at')
        .not('latitude', 'is', null)
        .not('latitude', 'eq', -99)
        .order('updated_at', { ascending: false })
        .limit(200) // Get recent ones

    if (fetchError) {
        console.error('Error fetching:', fetchError)
        return
    }

    // Filter to those updated in the last 30 minutes (from our previous script)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000)
    const toReset = recentlyModified?.filter(p => {
        const updatedAt = new Date(p.updated_at)
        return updatedAt > thirtyMinsAgo
    }) || []

    if (toReset.length === 0) {
        console.log('No recently modified properties found to reset.')
        console.log('\nRunning geocode script for any NULL coordinates...')
        return
    }

    console.log(`Found ${toReset.length} properties to reset to NULL for re-geocoding.\n`)

    // Reset coordinates to NULL
    for (const prop of toReset) {
        const { error: updateError } = await supabase
            .from('dup_properties')
            .update({ latitude: null, longitude: null })
            .eq('id', prop.id)

        if (updateError) {
            console.log(`❌ Failed to reset ${prop.property_name}: ${updateError.message}`)
        } else {
            console.log(`✅ Reset: ${prop.property_name?.substring(0, 50)}...`)
        }
    }

    console.log(`\n✅ Reset ${toReset.length} properties. Now run: npx tsx scripts/geocode_properties.ts`)
}

main().catch(console.error)
