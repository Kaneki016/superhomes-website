/**
 * TEST: Re-geocoding Script - Process only first 5 properties
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function geocodeAddress(address, state) {
    let searchQuery = address || ''
    if (state) searchQuery += ', ' + state
    searchQuery += ', Malaysia'
    searchQuery = searchQuery.replace(/\s+/g, ' ').replace(/,\s*,/g, ',').trim()

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=my`

    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'SuperHomes/1.0 (geocoding test)' }
        })
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
        console.error('Error:', error.message)
        return null
    }
}

async function main() {
    console.log('=== TEST RUN: First 5 properties ===\n')

    const { data: props } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state')
        .eq('latitude', -99)
        .limit(5)

    console.log(`Testing ${props?.length || 0} properties...\n`)

    for (let i = 0; i < (props?.length || 0); i++) {
        const p = props[i]
        console.log(`${i + 1}. ${(p.property_name || 'N/A').substring(0, 45)}`)
        console.log(`   Address: ${(p.address || 'N/A').substring(0, 50)}`)
        console.log(`   State: ${p.state || 'Unknown'}`)

        const coords = await geocodeAddress(p.address, p.state)

        if (coords) {
            console.log(`   ✅ Found: (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`)
            console.log(`   Location: ${coords.display_name.substring(0, 60)}...`)
        } else {
            console.log(`   ❌ Not found`)
        }
        console.log('')

        if (i < props.length - 1) await sleep(1100)
    }

    console.log('Test complete! If results look good, run the full script.')
}

main()
