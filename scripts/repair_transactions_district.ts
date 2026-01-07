
/**
 * Repair Transactions Geocoding (District Only)
 * 
 * Target Table: transactions
 * Problem: The table lacks a 'state' column, causing errors in scripts that expect it.
 * Solution: Geocode using "District, Malaysia" instead.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    console.log('🔧 Starting Transaction Repair (District Strategy)...\n')

    // 1. Fetch failed records
    // Only select columns that actually exist!
    const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, district')
        .eq('latitude', -99)

    if (error) {
        console.error('Error fetching failed records:', error)
        return
    }

    if (!rows || rows.length === 0) {
        console.log('✅ No failed records to repair.')
        return
    }

    console.log(`Found ${rows.length} records to repair.`)

    let repaired = 0
    let failed = 0
    const districtCache: Record<string, { lat: number, lng: number } | null> = {}

    for (const row of rows) {
        if (!row.district) {
            console.log(`Skipping ID ${row.id}: Missing district`)
            continue
        }

        // Clean up district name (e.g. "Klang District" -> "Klang")
        const cleanDistrict = row.district.replace(/\s*District\s*/i, '').trim()
        const cacheKey = cleanDistrict.toLowerCase()
        let coords: { lat: number, lng: number } | null = null

        if (cacheKey in districtCache) {
            coords = districtCache[cacheKey]
        } else {
            process.stdout.write(`Repairing: ${cleanDistrict}... `)

            try {
                // Search: "DistrictName, Malaysia"
                const query = encodeURIComponent(`${cleanDistrict}, Malaysia`)
                const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=my`

                const res = await fetch(url, {
                    headers: { 'User-Agent': 'SuperHomes Repair Script' }
                })

                if (res.ok) {
                    const data = await res.json()
                    if (data && data.length > 0) {
                        coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
                    }
                }
            } catch (e) {
                // Ignore network errors
            }

            // Update cache
            districtCache[cacheKey] = coords

            if (coords) console.log(`✅ Found`)
            else console.log(`❌ Not Found`)

            // Rate limit (1s)
            await new Promise(r => setTimeout(r, 1100))
        }

        if (coords) {
            await supabase.from('transactions').update({
                latitude: coords.lat,
                longitude: coords.lng
            }).eq('id', row.id)
            repaired++
        } else {
            failed++
        }
    }

    console.log('\n' + '='.repeat(40))
    console.log(`Repair Complete`)
    console.log(`Repaired: ${repaired}`)
    console.log(`Still Failed: ${failed}`)
}

main()
