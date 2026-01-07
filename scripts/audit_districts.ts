
/**
 * Audit District Geocoding
 * 
 * Verifies if the geocoded coordinates actually belong to the district
 * stated in the database by performing Reverse Geocoding checks.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function reverseGeocode(lat: number, lng: number): Promise<any> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        const res = await fetch(url, {
            headers: { 'User-Agent': 'SuperHomes District Auditor' }
        })
        if (!res.ok) return null
        return await res.json()
    } catch {
        return null
    }
}

async function main() {
    console.log('🕵️  Auditing District Matches (Sample of 20)...\n')

    // Get a sample of geocoded transactions
    // Note: Supabase doesn't support random selection easily, so we take a range
    const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, address, district, latitude, longitude')
        .not('latitude', 'is', null)
        .neq('latitude', -99)
        .limit(20)

    if (error || !rows) {
        console.error('Error fetching data:', error)
        return
    }

    let matchCount = 0
    let mismatchCount = 0
    let uncertainCount = 0

    for (const row of rows) {
        const dbDistrict = row.district?.toLowerCase().trim()
        if (!dbDistrict) continue

        console.log(`Checking: ${dbDistrict.toUpperCase()} vs Coords [${row.latitude}, ${row.longitude}]`)

        const result = await reverseGeocode(row.latitude, row.longitude)
        await new Promise(r => setTimeout(r, 1100)) // Rate limit

        if (!result || !result.address) {
            console.log('   ⚠️  Reverse geocoding failed/empty')
            uncertainCount++
            continue
        }

        const addr = result.address
        // Nominatim fields for district: district, city_district, municipality, city, county
        const reversedDistrict = (addr.district || addr.city_district || addr.municipality || addr.city || addr.county || '').toLowerCase()
        const reversedState = (addr.state || '').toLowerCase()

        console.log(`   📍 Found: ${reversedDistrict.toUpperCase()}, ${reversedState.toUpperCase()}`)

        // Simple substring matching (fuzzy)
        if (reversedDistrict.includes(dbDistrict) || dbDistrict.includes(reversedDistrict)) {
            console.log('   ✅ Match')
            matchCount++
        } else {
            console.log('   ❌ Mismatch')
            mismatchCount++
        }
        console.log('')
    }

    console.log('='.repeat(40))
    console.log(`Matched: ${matchCount}`)
    console.log(`Mismatched: ${mismatchCount}`)
    console.log(`Uncertain: ${uncertainCount}`)
    console.log('='.repeat(40))
}

main()
