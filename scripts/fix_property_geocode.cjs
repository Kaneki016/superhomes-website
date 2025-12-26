/**
 * Re-geocode a specific property with better accuracy
 * Uses address first, then tries with city/state
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// More precise geocoding - tries multiple strategies
async function geocodeAddressPrecise(address, state) {
    const strategies = []

    // Strategy 1: Full address with state
    if (address && address !== state) {
        strategies.push(`${address}, ${state}, Malaysia`)
    }

    // Strategy 2: Just the city/area from address
    // Extract city names like "Ipoh" from addresses
    if (address) {
        const cityMatch = address.match(/\b(Ipoh|Georgetown|Penang|Kuala Lumpur|Johor Bahru|Petaling Jaya|Shah Alam|Klang|Subang Jaya|Ampang|Cheras|Kajang|Seremban|Melaka|Kuching|Kota Kinabalu|Sandakan|Alor Setar|Kangar|Kuantan|Kuala Terengganu|Kota Bharu)\b/i)
        if (cityMatch) {
            strategies.push(`${cityMatch[1]}, ${state}, Malaysia`)
        }
    }

    // Strategy 3: Use the state capital if address parsing fails
    const stateCapitals = {
        'Perak': 'Ipoh, Perak, Malaysia',
        'Selangor': 'Shah Alam, Selangor, Malaysia',
        'Penang': 'George Town, Penang, Malaysia',
        'Johor': 'Johor Bahru, Johor, Malaysia',
        'Pahang': 'Kuantan, Pahang, Malaysia',
        'Negeri Sembilan': 'Seremban, Negeri Sembilan, Malaysia',
        'Kedah': 'Alor Setar, Kedah, Malaysia',
        'Kelantan': 'Kota Bharu, Kelantan, Malaysia',
        'Terengganu': 'Kuala Terengganu, Terengganu, Malaysia',
        'Melaka': 'Melaka, Malaysia',
        'Perlis': 'Kangar, Perlis, Malaysia',
        'Sabah': 'Kota Kinabalu, Sabah, Malaysia',
        'Sarawak': 'Kuching, Sarawak, Malaysia',
        'Kuala Lumpur': 'Kuala Lumpur, Malaysia',
        'Putrajaya': 'Putrajaya, Malaysia',
        'Labuan': 'Labuan, Malaysia'
    }

    if (state && stateCapitals[state]) {
        strategies.push(stateCapitals[state])
    }

    for (const searchQuery of strategies) {
        console.log(`  Trying: "${searchQuery}"`)

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=my`

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'SuperHomes/1.0 (precision geocoding)' }
            })
            const data = await response.json()

            if (data && data.length > 0) {
                return {
                    latitude: parseFloat(data[0].lat),
                    longitude: parseFloat(data[0].lon),
                    display_name: data[0].display_name,
                    strategy: searchQuery
                }
            }
        } catch (error) {
            console.error('  Error:', error.message)
        }

        await sleep(1100) // Rate limit
    }

    return null
}

async function main() {
    const propertyId = '509e747f-bc23-49af-8826-b4470fb40219'

    // Get property
    const { data: prop, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .eq('id', propertyId)
        .single()

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('Current property:')
    console.log('  Name:', prop.property_name)
    console.log('  Address:', prop.address)
    console.log('  State:', prop.state)
    console.log('  Current coords:', prop.latitude, prop.longitude)
    console.log('')
    console.log('Attempting precise geocoding...')

    const result = await geocodeAddressPrecise(prop.address, prop.state)

    if (result) {
        console.log('')
        console.log('✅ Found better coordinates:')
        console.log('  New coords:', result.latitude, result.longitude)
        console.log('  Location:', result.display_name)
        console.log('  Strategy used:', result.strategy)

        // Update the database
        const { error: updateError } = await supabase
            .from('dup_properties')
            .update({
                latitude: result.latitude,
                longitude: result.longitude
            })
            .eq('id', propertyId)

        if (updateError) {
            console.log('❌ Failed to update:', updateError.message)
        } else {
            console.log('✅ Database updated!')
        }
    } else {
        console.log('❌ Could not find better coordinates')
    }
}

main()
