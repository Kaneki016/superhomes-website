/**
 * Validate Geocoding Accuracy
 * 
 * Checks if property coordinates fall within expected Malaysian state boundaries
 * Identifies properties where coordinates don't match the stated address/state
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Approximate bounding boxes for Malaysian states
// Format: { minLat, maxLat, minLon, maxLon }
const stateBounds = {
    'Johor': { minLat: 1.3, maxLat: 2.9, minLon: 102.4, maxLon: 104.4 },
    'Kedah': { minLat: 5.0, maxLat: 6.7, minLon: 99.6, maxLon: 101.1 },
    'Kelantan': { minLat: 4.5, maxLat: 6.3, minLon: 101.2, maxLon: 102.6 },
    'Melaka': { minLat: 2.0, maxLat: 2.5, minLon: 102.0, maxLon: 102.6 },
    'Negeri Sembilan': { minLat: 2.4, maxLat: 3.2, minLon: 101.4, maxLon: 102.5 },
    'Pahang': { minLat: 2.8, maxLat: 4.9, minLon: 101.3, maxLon: 103.5 },
    'Penang': { minLat: 5.1, maxLat: 5.6, minLon: 100.1, maxLon: 100.6 },
    'Perak': { minLat: 3.6, maxLat: 5.8, minLon: 100.0, maxLon: 101.8 },
    'Perlis': { minLat: 6.3, maxLat: 6.7, minLon: 100.0, maxLon: 100.5 },
    'Sabah': { minLat: 4.0, maxLat: 7.4, minLon: 115.5, maxLon: 119.3 },
    'Sarawak': { minLat: 0.8, maxLat: 5.1, minLon: 109.5, maxLon: 115.8 },
    'Selangor': { minLat: 2.6, maxLat: 3.8, minLon: 100.7, maxLon: 102.0 },
    'Terengganu': { minLat: 4.0, maxLat: 5.9, minLon: 102.3, maxLon: 103.5 },
    'Kuala Lumpur': { minLat: 3.0, maxLat: 3.25, minLon: 101.6, maxLon: 101.8 },
    'Putrajaya': { minLat: 2.85, maxLat: 3.0, minLon: 101.6, maxLon: 101.75 },
    'Labuan': { minLat: 5.2, maxLat: 5.4, minLon: 115.1, maxLon: 115.4 }
}

// Normalize state names to match our bounds keys
function normalizeStateName(state) {
    if (!state) return null

    const stateMap = {
        'johor': 'Johor',
        'kedah': 'Kedah',
        'kelantan': 'Kelantan',
        'melaka': 'Melaka',
        'malacca': 'Melaka',
        'negeri sembilan': 'Negeri Sembilan',
        'n. sembilan': 'Negeri Sembilan',
        'ns': 'Negeri Sembilan',
        'pahang': 'Pahang',
        'penang': 'Penang',
        'pulau pinang': 'Penang',
        'perak': 'Perak',
        'perlis': 'Perlis',
        'sabah': 'Sabah',
        'sarawak': 'Sarawak',
        'selangor': 'Selangor',
        'terengganu': 'Terengganu',
        'kuala lumpur': 'Kuala Lumpur',
        'kl': 'Kuala Lumpur',
        'w.p. kuala lumpur': 'Kuala Lumpur',
        'wilayah persekutuan kuala lumpur': 'Kuala Lumpur',
        'putrajaya': 'Putrajaya',
        'w.p. putrajaya': 'Putrajaya',
        'labuan': 'Labuan',
        'w.p. labuan': 'Labuan'
    }

    const normalized = stateMap[state.toLowerCase().trim()]
    return normalized || null
}

// Check if coordinates are within a state's bounding box
function isWithinState(lat, lon, stateName) {
    const bounds = stateBounds[stateName]
    if (!bounds) return null // Unknown state

    return lat >= bounds.minLat && lat <= bounds.maxLat &&
        lon >= bounds.minLon && lon <= bounds.maxLon
}

async function main() {
    console.log('Validating geocoding accuracy for all properties...')
    console.log('')

    // Fetch all properties
    const { data: properties, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .neq('latitude', -99)
        .order('state')

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('Total properties to check:', properties.length)
    console.log('')

    const mismatches = []
    const unknownStates = []
    let correctCount = 0
    let unknownStateCount = 0

    for (const prop of properties) {
        const normalizedState = normalizeStateName(prop.state)

        if (!normalizedState) {
            unknownStateCount++
            unknownStates.push({
                id: prop.id,
                name: prop.property_name,
                state: prop.state
            })
            continue
        }

        const isCorrect = isWithinState(prop.latitude, prop.longitude, normalizedState)

        if (isCorrect === null) {
            unknownStateCount++
        } else if (isCorrect) {
            correctCount++
        } else {
            mismatches.push({
                id: prop.id,
                name: prop.property_name,
                address: prop.address,
                state: prop.state,
                normalizedState,
                lat: prop.latitude,
                lon: prop.longitude
            })
        }
    }

    console.log('='.repeat(60))
    console.log('VALIDATION RESULTS')
    console.log('='.repeat(60))
    console.log('Correct coordinates:', correctCount)
    console.log('Mismatched coordinates:', mismatches.length)
    console.log('Unknown states:', unknownStateCount)
    console.log('')

    if (mismatches.length > 0) {
        console.log('PROPERTIES WITH MISMATCHED COORDINATES:')
        console.log('(Coordinates fall outside expected state boundaries)')
        console.log('')

        // Group by state for easier review
        const byState = {}
        for (const m of mismatches) {
            if (!byState[m.state]) byState[m.state] = []
            byState[m.state].push(m)
        }

        for (const [state, props] of Object.entries(byState)) {
            console.log(`\n=== ${state} (${props.length} mismatches) ===`)
            props.slice(0, 5).forEach((p, i) => {
                console.log(`${i + 1}. ${(p.name || 'N/A').substring(0, 40)}`)
                console.log(`   Address: ${(p.address || 'N/A').substring(0, 50)}`)
                console.log(`   Coords: (${p.lat}, ${p.lon})`)
            })
            if (props.length > 5) {
                console.log(`   ... and ${props.length - 5} more`)
            }
        }

        // Save full list to file
        const report = mismatches.map((m, i) =>
            `${i + 1}. ${m.name}\n   ID: ${m.id}\n   Address: ${m.address}\n   State: ${m.state}\n   Coords: (${m.lat}, ${m.lon})\n`
        ).join('\n')

        fs.writeFileSync('scripts/geocoding_mismatches.txt',
            `GEOCODING MISMATCHES REPORT\nTotal: ${mismatches.length}\n\n${report}`,
            'utf8')

        console.log('\nFull report saved to: scripts/geocoding_mismatches.txt')

        // Also save IDs for batch processing
        const ids = mismatches.map(m => m.id)
        fs.writeFileSync('scripts/mismatch_ids.json', JSON.stringify(ids, null, 2), 'utf8')
        console.log('Mismatch IDs saved to: scripts/mismatch_ids.json')
    } else {
        console.log('✅ All properties have coordinates within expected state boundaries!')
    }
}

main()
