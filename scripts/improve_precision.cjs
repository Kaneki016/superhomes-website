/**
 * Improve geocoding for low-precision properties
 * Uses multiple search strategies to find better coordinates
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Try geocoding with multiple strategies
async function improvedGeocode(propertyName, address, state) {
    const strategies = []

    // Strategy 1: Property name + state (often property name contains location)
    if (propertyName) {
        // Extract location hints from property name
        // e.g., "Setia Alam" from "3-storey house at Setia Alam"
        strategies.push(`${propertyName}, ${state}, Malaysia`)
    }

    // Strategy 2: Full address if different from just state
    if (address && address.toLowerCase().trim() !== state?.toLowerCase()?.trim()) {
        strategies.push(`${address}, Malaysia`)
    }

    // Strategy 3: Extract area from property name
    if (propertyName) {
        // Common patterns in property names
        const areaMatch = propertyName.match(/(?:at|@|in|near)\s+([^,]+)/i)
        if (areaMatch) {
            strategies.push(`${areaMatch[1].trim()}, ${state}, Malaysia`)
        }

        // Try the first few words which often contain location
        const words = propertyName.split(/\s+/).slice(0, 4).join(' ')
        if (words.length > 5) {
            strategies.push(`${words}, ${state}, Malaysia`)
        }
    }

    for (const query of strategies) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=my`

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'SuperHomes/1.0 (precision improvement)' }
            })
            const data = await response.json()

            if (data && data.length > 0) {
                const result = data[0]
                // Check if result is in Malaysia and has reasonable precision
                if (result.class && (result.class === 'place' || result.class === 'boundary' ||
                    result.class === 'building' || result.class === 'highway' || result.class === 'amenity')) {
                    return {
                        lat: parseFloat(result.lat),
                        lon: parseFloat(result.lon),
                        display_name: result.display_name,
                        strategy: query,
                        class: result.class
                    }
                }
            }
        } catch (err) {
            // Ignore errors, try next strategy
        }

        await sleep(1100) // Rate limit
    }

    return null
}

async function main() {
    // Load low precision properties
    const report = JSON.parse(fs.readFileSync('scripts/precision_report.json', 'utf8'))
    const lowPrecision = report.lowPrecision

    console.log('='.repeat(60))
    console.log('IMPROVING GEOCODING FOR LOW-PRECISION PROPERTIES')
    console.log('Total to process:', lowPrecision.length)
    console.log('='.repeat(60))
    console.log('')

    let improved = 0
    let unchanged = 0
    const results = []

    for (let i = 0; i < lowPrecision.length; i++) {
        const prop = lowPrecision[i]
        console.log(`[${i + 1}/${lowPrecision.length}] ${(prop.name || 'N/A').substring(0, 40)}`)
        console.log(`  Address: ${prop.address}`)

        const newCoords = await improvedGeocode(prop.name, prop.address, prop.state)

        if (newCoords) {
            // Check if new coordinates are significantly different
            const latDiff = Math.abs(newCoords.lat - prop.lat)
            const lonDiff = Math.abs(newCoords.lon - prop.lon)

            if (latDiff > 0.01 || lonDiff > 0.01) { // More than ~1km difference
                console.log(`  ✅ Found better: (${newCoords.lat.toFixed(4)}, ${newCoords.lon.toFixed(4)})`)
                console.log(`  Location: ${newCoords.display_name.substring(0, 50)}...`)

                // Update database
                const { error } = await supabase
                    .from('dup_properties')
                    .update({ latitude: newCoords.lat, longitude: newCoords.lon })
                    .eq('id', prop.id)

                if (!error) {
                    improved++
                    results.push({ id: prop.id, status: 'improved', newCoords })
                } else {
                    console.log(`  ❌ Update failed`)
                    unchanged++
                }
            } else {
                console.log(`  ⏭️ Same location, keeping existing`)
                unchanged++
            }
        } else {
            console.log(`  ⚠️ No better match found`)
            unchanged++
        }

        console.log('')
    }

    console.log('='.repeat(60))
    console.log('RESULTS')
    console.log('='.repeat(60))
    console.log('Improved:', improved)
    console.log('Unchanged:', unchanged)
}

main()
