const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    // Get min/max latitude and longitude values
    const { data } = await supabase.rpc('get_coord_stats')

    // If RPC doesn't exist, do manual queries
    // Get lowest latitudes
    const { data: lowLat } = await supabase
        .from('dup_properties')
        .select('latitude')
        .order('latitude', { ascending: true })
        .limit(5)

    // Get highest latitudes
    const { data: highLat } = await supabase
        .from('dup_properties')
        .select('latitude')
        .order('latitude', { ascending: false })
        .limit(5)

    // Get lowest longitudes
    const { data: lowLng } = await supabase
        .from('dup_properties')
        .select('longitude')
        .order('longitude', { ascending: true })
        .limit(5)

    // Get highest longitudes
    const { data: highLng } = await supabase
        .from('dup_properties')
        .select('longitude')
        .order('longitude', { ascending: false })
        .limit(5)

    console.log('='.repeat(50))
    console.log('COORDINATE VALUE RANGES')
    console.log('='.repeat(50))
    console.log('')
    console.log('Lowest latitudes:', lowLat?.map(p => p.latitude).join(', '))
    console.log('Highest latitudes:', highLat?.map(p => p.latitude).join(', '))
    console.log('')
    console.log('Lowest longitudes:', lowLng?.map(p => p.longitude).join(', '))
    console.log('Highest longitudes:', highLng?.map(p => p.longitude).join(', '))
    console.log('')
    console.log('Expected for Malaysia:')
    console.log('  Latitude: 1° to 7° N (positive)')
    console.log('  Longitude: 100° to 119° E (positive)')
}

main()
