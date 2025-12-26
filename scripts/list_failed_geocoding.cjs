const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    // Get all properties with -99 coordinates
    const { data: invalid, count } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, city, latitude, longitude', { count: 'exact' })
        .eq('latitude', -99)

    // Total properties
    const { count: total } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })

    console.log('='.repeat(60))
    console.log('DUP_PROPERTIES - FAILED GEOCODING REPORT')
    console.log('='.repeat(60))
    console.log('Total properties:', total)
    console.log('Valid coordinates:', total - count)
    console.log('Failed geocoding (-99):', count)
    console.log('='.repeat(60))

    if (invalid && invalid.length > 0) {
        console.log('\nPROPERTIES WITH FAILED GEOCODING:\n')
        invalid.forEach((p, i) => {
            console.log(`${i + 1}. ${(p.property_name || 'No name').substring(0, 55)}`)
            console.log(`   ID: ${p.id}`)
            console.log(`   Address: ${(p.address || 'N/A').substring(0, 60)}`)
            console.log(`   State: ${p.state || p.city || 'Unknown'}`)
            console.log('')
        })
    }
}

main()
