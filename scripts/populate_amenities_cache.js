/**
 * Pre-populate Amenities Cache Script
 * 
 * This script fetches amenities for all unique property locations
 * and saves them to the database cache, so users get instant page loads.
 * 
 * Usage: npm run populate-amenities
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials in environment variables')
    console.error('   Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Delay between API calls to avoid rate limiting (5 seconds)
const DELAY_MS = 5000

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Simplified amenities fetching (calls the Overpass API directly)
async function fetchAndCacheAmenities(lat, lon, coordKey) {
    const radiusMeters = 5000 // 5km

    const query = `
[out:json][timeout:30];
(
  nwr["amenity"~"^(school|hospital)$"](around:${radiusMeters},${lat},${lon});
  nwr["railway"~"^(station|halt)$"](around:${radiusMeters},${lat},${lon});
  nwr["station"="light_rail"](around:${radiusMeters},${lat},${lon});
  nwr["shop"="mall"](around:${radiusMeters},${lat},${lon});
);
out center;
`.trim()

    try {
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: { 'Content-Type': 'text/plain' }
        })

        if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status}`)
        }

        const data = await response.json()
        const amenities = data.elements || []

        // Save to database
        await supabase
            .from('cached_amenities')
            .upsert({
                coord_key: coordKey,
                amenities: amenities
            }, { onConflict: 'coord_key' })

        return amenities.length
    } catch (error) {
        throw error
    }
}

async function main() {
    console.log('🚀 Starting amenities cache population...\n')

    // Fetch all unique coordinates from listings
    const { data: listings, error } = await supabase
        .from('listings')
        .select('latitude, longitude')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

    if (error) {
        console.error('❌ Error fetching listings:', error)
        process.exit(1)
    }

    if (!listings || listings.length === 0) {
        console.log('⚠️  No listings found with coordinates')
        return
    }

    // Get unique coordinates (rounded to 4 decimals)
    const uniqueCoords = new Map()
    for (const listing of listings) {
        const lat = Number(listing.latitude)
        const lon = Number(listing.longitude)

        if (isNaN(lat) || isNaN(lon)) continue

        const key = `${lat.toFixed(4)},${lon.toFixed(4)}`
        if (!uniqueCoords.has(key)) {
            uniqueCoords.set(key, { lat, lon })
        }
    }

    console.log(`📍 Found ${listings.length} properties`)
    console.log(`📍 Found ${uniqueCoords.size} unique locations\n`)

    // Check which locations are already cached
    const coordKeys = Array.from(uniqueCoords.keys())
    const { data: cached } = await supabase
        .from('cached_amenities')
        .select('coord_key')
        .in('coord_key', coordKeys)

    const cachedKeys = new Set((cached || []).map(c => c.coord_key))
    const uncachedCoords = Array.from(uniqueCoords.entries())
        .filter(([key]) => !cachedKeys.has(key))

    console.log(`✅ Already cached: ${cachedKeys.size} locations`)
    console.log(`⏳ Need to fetch: ${uncachedCoords.length} locations\n`)

    if (uncachedCoords.length === 0) {
        console.log('🎉 All locations already cached!')
        return
    }

    // Fetch amenities for uncached locations
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < uncachedCoords.length; i++) {
        const [key, { lat, lon }] = uncachedCoords[i]
        const progress = `[${i + 1}/${uncachedCoords.length}]`

        try {
            console.log(`${progress} Fetching amenities for ${key}...`)

            const count = await fetchAndCacheAmenities(lat, lon, key)

            console.log(`${progress} ✅ Found ${count} amenities`)
            successCount++

            // Rate limiting delay (except for last item)
            if (i < uncachedCoords.length - 1) {
                await sleep(DELAY_MS)
            }
        } catch (error) {
            console.error(`${progress} ❌ Error:`, error.message)
            errorCount++
        }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Summary:')
    console.log(`   ✅ Successfully cached: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📍 Total cached locations: ${cachedKeys.size + successCount}`)
    console.log('='.repeat(50))
    console.log('\n🎉 Done! All property locations now have cached amenities.')
}

main().catch(console.error)
