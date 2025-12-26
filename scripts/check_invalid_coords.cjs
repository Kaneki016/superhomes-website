const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    // Check for various invalid coordinate patterns
    // -99, -99.0, 0, null, or out-of-range values

    console.log('Checking for invalid coordinates...\n')

    // 1. Check for -99 values
    const { data: neg99, count: neg99Count } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, latitude, longitude', { count: 'exact' })
        .lt('latitude', -90)  // Valid lat is -90 to 90, so <-90 is invalid

    console.log('Properties with latitude < -90:', neg99Count || 0)

    // 2. Check for 0,0 coordinates (often default/invalid)
    const { count: zeroCount } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', 0)
        .eq('longitude', 0)

    console.log('Properties with (0, 0):', zeroCount || 0)

    // 3. Get sample of latitude values to see distribution
    const { data: sample } = await supabase
        .from('dup_properties')
        .select('latitude, longitude')
        .order('latitude', { ascending: true })
        .limit(10)

    console.log('\nLowest 10 latitude values:')
    sample?.forEach(p => console.log(`  Lat: ${p.latitude}, Lng: ${p.longitude}`))

    // 4. Get unique low latitude values
    const { data: lowLat } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, city, latitude, longitude')
        .lt('latitude', 0)  // Malaysia latitudes should all be positive (1-7 degrees N)
        .order('latitude', { ascending: true })
        .limit(200)

    console.log('\n' + '='.repeat(60))
    console.log('Properties with NEGATIVE latitude (invalid for Malaysia):')
    console.log('Count:', lowLat?.length || 0)
    console.log('='.repeat(60))

    if (lowLat && lowLat.length > 0) {
        console.log('')
        lowLat.forEach((p, i) => {
            console.log(`${i + 1}. ${(p.property_name || 'No name').substring(0, 50)}`)
            console.log(`   ID: ${p.id}`)
            console.log(`   Address: ${(p.address || 'N/A').substring(0, 55)}`)
            console.log(`   State: ${p.state || p.city || 'Unknown'}`)
            console.log(`   Coords: (${p.latitude}, ${p.longitude})`)
            console.log('')
        })
    }
}

main()
