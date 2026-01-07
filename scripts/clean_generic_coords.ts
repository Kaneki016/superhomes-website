
/**
 * Clean Generic Coordinates
 * 
 * Target: [4.5693754, 102.2656823]
 * This is the generic returned value for "Malaysia" when street address lookup fails.
 * We want to mark these as -99 (Failed) so they don't appear as a giant cluster in the jungle.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// The generic coordinate to target
const TARGET_LAT = 4.5693754
const TARGET_LNG = 102.2656823
const EPSILON = 0.0000001 // Floating point tolerance

async function main() {
    console.log('🧹 Cleaning Generic Coordinates...\n')
    console.log(`Target: [${TARGET_LAT}, ${TARGET_LNG}]`)

    // 1. Count the records first
    const { count, error } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        // Use a small range to catch float variations
        .gt('latitude', TARGET_LAT - EPSILON)
        .lt('latitude', TARGET_LAT + EPSILON)
        .gt('longitude', TARGET_LNG - EPSILON)
        .lt('longitude', TARGET_LNG + EPSILON)

    if (error) {
        console.error('Error counting:', error)
        return
    }

    if (!count || count === 0) {
        console.log('✅ No generic records found to clean.')
        return
    }

    console.log(`⚠️  Found ${count} records with generic coordinates. Purging...`)

    // 2. Update them to -99
    // We do this in batches just in case, though a single update might work for 10k rows
    const { error: updateError } = await supabase
        .from('transactions')
        .update({ latitude: -99, longitude: -99 })
        .gt('latitude', TARGET_LAT - EPSILON)
        .lt('latitude', TARGET_LAT + EPSILON)
        .gt('longitude', TARGET_LNG - EPSILON)
        .lt('longitude', TARGET_LNG + EPSILON)

    if (updateError) {
        console.error('❌ Error updating:', updateError)
    } else {
        console.log(`✅ Successfully marked ${count} records as Failed (-99).`)
    }
}

main()
