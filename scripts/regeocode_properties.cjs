/**
 * Re-geocoding Script for Failed Properties
 * 
 * This script re-attempts geocoding for properties with -99 latitude/longitude
 * using OpenStreetMap Nominatim API (free, rate-limited to 1 req/sec)
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Rate limiting - Nominatim requires 1 request per second
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Geocode an address using Nominatim
async function geocodeAddress(address, state) {
    // Clean and prepare the address
    let searchQuery = address || ''

    // Add state if available
    if (state) {
        searchQuery += ', ' + state
    }

    // Always add Malaysia to improve accuracy
    searchQuery += ', Malaysia'

    // Clean up the query
    searchQuery = searchQuery
        .replace(/\s+/g, ' ')
        .replace(/,\s*,/g, ',')
        .trim()

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=my`

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SuperHomes/1.0 (property geocoding)'
            }
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                display_name: data[0].display_name
            }
        }

        return null
    } catch (error) {
        console.error('Geocoding error:', error.message)
        return null
    }
}

// Try alternative geocoding strategies
async function geocodeWithFallback(address, state, propertyName) {
    // Strategy 1: Full address
    let result = await geocodeAddress(address, state)
    if (result) return { ...result, strategy: 'full_address' }

    await sleep(1100) // Rate limit

    // Strategy 2: Just the state/area
    if (state) {
        result = await geocodeAddress(state, null)
        if (result) return { ...result, strategy: 'state_only' }
        await sleep(1100)
    }

    // Strategy 3: Extract area name from address (last part before state)
    if (address) {
        const parts = address.split(',')
        if (parts.length >= 2) {
            const area = parts[parts.length - 1].trim()
            result = await geocodeAddress(area, state)
            if (result) return { ...result, strategy: 'area_name' }
        }
    }

    return null
}

async function main() {
    console.log('='.repeat(60))
    console.log('RE-GEOCODING FAILED PROPERTIES')
    console.log('Using OpenStreetMap Nominatim API')
    console.log('='.repeat(60))
    console.log('')

    // Get all properties with -99 coordinates
    const { data: failedProperties, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .eq('latitude', -99)

    if (error) {
        console.error('Error fetching properties:', error.message)
        return
    }

    const total = failedProperties?.length || 0
    console.log(`Found ${total} properties with failed geocoding`)
    console.log('Estimated time:', Math.ceil(total * 1.5 / 60), 'minutes')
    console.log('')

    if (total === 0) {
        console.log('No properties need re-geocoding!')
        return
    }

    let success = 0
    let failed = 0
    const results = {
        success: [],
        failed: []
    }

    for (let i = 0; i < failedProperties.length; i++) {
        const prop = failedProperties[i]
        const progress = `[${i + 1}/${total}]`

        console.log(`${progress} Processing: ${(prop.property_name || 'N/A').substring(0, 40)}...`)

        const coords = await geocodeWithFallback(prop.address, prop.state, prop.property_name)

        if (coords) {
            // Update the database
            const { error: updateError } = await supabase
                .from('dup_properties')
                .update({
                    latitude: coords.latitude,
                    longitude: coords.longitude
                })
                .eq('id', prop.id)

            if (updateError) {
                console.log(`  ❌ DB update failed: ${updateError.message}`)
                failed++
                results.failed.push({ ...prop, error: updateError.message })
            } else {
                console.log(`  ✅ Updated: (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}) [${coords.strategy}]`)
                success++
                results.success.push({ ...prop, coords })
            }
        } else {
            console.log(`  ⚠️ Could not geocode`)
            failed++
            results.failed.push({ ...prop, error: 'Geocoding failed' })
        }

        // Rate limit - wait 1.1 seconds between requests
        if (i < failedProperties.length - 1) {
            await sleep(1100)
        }

        // Save progress every 50 properties
        if ((i + 1) % 50 === 0) {
            console.log('')
            console.log(`Progress: ${success} success, ${failed} failed`)
            console.log('')
        }
    }

    // Final summary
    console.log('')
    console.log('='.repeat(60))
    console.log('FINAL RESULTS')
    console.log('='.repeat(60))
    console.log('Total processed:', total)
    console.log('Successfully geocoded:', success)
    console.log('Still failed:', failed)
    console.log('Success rate:', ((success / total) * 100).toFixed(1) + '%')

    // Save failed list for manual review
    if (results.failed.length > 0) {
        const failedReport = results.failed.map((p, i) =>
            `${i + 1}. ${p.property_name || 'N/A'}\n   ID: ${p.id}\n   Address: ${p.address || 'N/A'}\n   State: ${p.state || 'Unknown'}\n   Error: ${p.error}\n`
        ).join('\n')

        fs.writeFileSync('scripts/still_failed_geocoding.txt',
            `STILL FAILED AFTER RE-GEOCODING\nTotal: ${results.failed.length}\n\n${failedReport}`,
            'utf8'
        )
        console.log('')
        console.log('Failed properties saved to: scripts/still_failed_geocoding.txt')
    }
}

main()
