const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    const propertyId = '509e747f-bc23-49af-8826-b4470fb40219'

    const { data, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .eq('id', propertyId)
        .single()

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('Property Details:')
    console.log('=================')
    console.log('Name:', data.property_name)
    console.log('Address:', data.address)
    console.log('State:', data.state)
    console.log('Latitude:', data.latitude)
    console.log('Longitude:', data.longitude)
    console.log('')

    // Check what these coordinates actually point to
    // Ipoh is approximately: 4.5975° N, 101.0901° E
    // Kuala Lipis is approximately: 4.1857° N, 101.9381° E

    console.log('Expected Ipoh coords: ~4.5975, 101.0901')
    console.log('Actual coords:', data.latitude, ',', data.longitude)

    if (data.latitude && data.longitude) {
        // Calculate distance from expected Ipoh center
        const ipohLat = 4.5975
        const ipohLon = 101.0901
        const R = 6371 // km
        const dLat = (data.latitude - ipohLat) * Math.PI / 180
        const dLon = (data.longitude - ipohLon) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(ipohLat * Math.PI / 180) * Math.cos(data.latitude * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        console.log('')
        console.log('Distance from Ipoh center:', distance.toFixed(2), 'km')
    }
}

main()
