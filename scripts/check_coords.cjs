const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    // Total count
    const { count: total } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })

    // Missing latitude (null)
    const { data: missingLat, count: missingLatCount } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, city', { count: 'exact' })
        .is('latitude', null)

    console.log('='.repeat(50))
    console.log('DUP_PROPERTIES TABLE - COORDINATE STATUS')
    console.log('='.repeat(50))
    console.log('Total properties:', total)
    console.log('Missing latitude:', missingLatCount)
    console.log('With coordinates:', total - missingLatCount)
    console.log('='.repeat(50))

    if (missingLat && missingLat.length > 0) {
        console.log('\nPROPERTIES MISSING COORDINATES:\n')
        missingLat.forEach((p, i) => {
            console.log(`${i + 1}. ${p.property_name || 'No name'}`)
            console.log(`   ID: ${p.id}`)
            console.log(`   Address: ${p.address || 'N/A'}`)
            console.log(`   State: ${p.state || p.city || 'Unknown'}`)
            console.log('')
        })
    } else {
        console.log('\nAll properties have coordinates!')
    }
}

main()
