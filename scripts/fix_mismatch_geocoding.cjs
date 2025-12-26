/**
 * Fix mismatched geocoding for specific properties
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Malaysian state capitals for fallback
const stateCapitals = {
    'Johor': { lat: 1.4927, lon: 103.7414, name: 'Johor Bahru' },
    'Kedah': { lat: 6.1254, lon: 100.3673, name: 'Alor Setar' },
    'Kelantan': { lat: 6.1256, lon: 102.2389, name: 'Kota Bharu' },
    'Melaka': { lat: 2.1896, lon: 102.2501, name: 'Melaka' },
    'Negeri Sembilan': { lat: 2.7259, lon: 101.9424, name: 'Seremban' },
    'Pahang': { lat: 3.8077, lon: 103.3260, name: 'Kuantan' },
    'Penang': { lat: 5.4141, lon: 100.3288, name: 'George Town' },
    'Perak': { lat: 4.5975, lon: 101.0901, name: 'Ipoh' },
    'Perlis': { lat: 6.4414, lon: 100.1986, name: 'Kangar' },
    'Sabah': { lat: 5.9749, lon: 116.0724, name: 'Kota Kinabalu' },
    'Sarawak': { lat: 1.5535, lon: 110.3593, name: 'Kuching' },
    'Selangor': { lat: 3.0738, lon: 101.5183, name: 'Shah Alam' },
    'Terengganu': { lat: 5.3117, lon: 103.1324, name: 'Kuala Terengganu' },
    'Kuala Lumpur': { lat: 3.1390, lon: 101.6869, name: 'Kuala Lumpur' },
    'Putrajaya': { lat: 2.9264, lon: 101.6964, name: 'Putrajaya' },
    'Labuan': { lat: 5.2831, lon: 115.2308, name: 'Labuan' }
}

// Normalize state name
function normalizeState(state) {
    if (!state) return null
    const s = state.toLowerCase().trim()

    if (s.includes('johor')) return 'Johor'
    if (s.includes('kedah')) return 'Kedah'
    if (s.includes('kelantan')) return 'Kelantan'
    if (s.includes('melaka') || s.includes('malacca')) return 'Melaka'
    if (s.includes('sembilan')) return 'Negeri Sembilan'
    if (s.includes('pahang')) return 'Pahang'
    if (s.includes('penang') || s.includes('pinang')) return 'Penang'
    if (s.includes('perak')) return 'Perak'
    if (s.includes('perlis')) return 'Perlis'
    if (s.includes('sabah')) return 'Sabah'
    if (s.includes('sarawak')) return 'Sarawak'
    if (s.includes('selangor')) return 'Selangor'
    if (s.includes('terengganu')) return 'Terengganu'
    if (s.includes('kuala lumpur') || s === 'kl') return 'Kuala Lumpur'
    if (s.includes('putrajaya')) return 'Putrajaya'
    if (s.includes('labuan')) return 'Labuan'

    return null
}

// Geocode with address-based approach
async function geocodeProperty(address, state) {
    const normalizedState = normalizeState(state)

    // Try the full address first
    if (address) {
        const searchQuery = `${address}, ${state}, Malaysia`
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=my`

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'SuperHomes/1.0 (geocoding fix)' }
            })
            const data = await response.json()

            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lon: parseFloat(data[0].lon),
                    method: 'address',
                    display_name: data[0].display_name
                }
            }
        } catch (err) {
            console.log('  Address geocoding failed:', err.message)
        }

        await sleep(1100)
    }

    // Fall back to state capital
    if (normalizedState && stateCapitals[normalizedState]) {
        const capital = stateCapitals[normalizedState]
        return {
            lat: capital.lat,
            lon: capital.lon,
            method: 'state_capital',
            display_name: `${capital.name}, ${normalizedState}, Malaysia`
        }
    }

    return null
}

async function main() {
    // Read mismatch IDs
    const ids = JSON.parse(fs.readFileSync('scripts/mismatch_ids.json', 'utf8'))

    console.log('='.repeat(60))
    console.log('FIXING MISMATCHED GEOCODING')
    console.log('Properties to fix:', ids.length)
    console.log('='.repeat(60))
    console.log('')

    let fixed = 0
    let failed = 0

    for (const id of ids) {
        // Get property details
        const { data: prop, error } = await supabase
            .from('dup_properties')
            .select('id, property_name, address, state, latitude, longitude')
            .eq('id', id)
            .single()

        if (error) {
            console.log(`❌ Error fetching ${id}:`, error.message)
            failed++
            continue
        }

        console.log(`Processing: ${(prop.property_name || 'N/A').substring(0, 40)}`)
        console.log(`  Address: ${prop.address}`)
        console.log(`  State: ${prop.state}`)
        console.log(`  Current coords: (${prop.latitude}, ${prop.longitude})`)

        const newCoords = await geocodeProperty(prop.address, prop.state)

        if (newCoords) {
            console.log(`  ✅ New coords: (${newCoords.lat}, ${newCoords.lon}) [${newCoords.method}]`)
            console.log(`  Location: ${newCoords.display_name}`)

            // Update database
            const { error: updateError } = await supabase
                .from('dup_properties')
                .update({
                    latitude: newCoords.lat,
                    longitude: newCoords.lon
                })
                .eq('id', id)

            if (updateError) {
                console.log(`  ❌ Update failed:`, updateError.message)
                failed++
            } else {
                console.log(`  ✅ Updated!`)
                fixed++
            }
        } else {
            console.log(`  ❌ Could not geocode`)
            failed++
        }

        console.log('')
        await sleep(1100)
    }

    console.log('='.repeat(60))
    console.log('RESULTS')
    console.log('='.repeat(60))
    console.log('Fixed:', fixed)
    console.log('Failed:', failed)
}

main()
