const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
    // Get properties with -99 latitude
    const { data: invalid, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .filter('latitude', 'eq', -99)

    if (error) {
        console.log('Error:', error.message)
        return
    }

    // Total properties
    const { count: total } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })

    const count = invalid?.length || 0

    console.log('============================================================')
    console.log('FAILED GEOCODING REPORT')
    console.log('============================================================')
    console.log('Total properties: ' + total)
    console.log('Valid coordinates: ' + (total - count))
    console.log('Failed geocoding (-99): ' + count)
    console.log('============================================================')

    if (invalid && invalid.length > 0) {
        // Write full list to file
        const lines = []
        lines.push('FAILED GEOCODING REPORT')
        lines.push('Generated: ' + new Date().toLocaleString())
        lines.push('Total failed: ' + count + ' properties')
        lines.push('')
        lines.push('============================================================')
        lines.push('')

        invalid.forEach((p, i) => {
            lines.push((i + 1) + '. ' + (p.property_name || 'No name'))
            lines.push('   ID: ' + p.id)
            lines.push('   Address: ' + (p.address || 'N/A'))
            lines.push('   State: ' + (p.state || 'Unknown'))
            lines.push('')
        })

        fs.writeFileSync('scripts/failed_geocoding_list.txt', lines.join('\n'), 'utf8')
        console.log('')
        console.log('Full list saved to: scripts/failed_geocoding_list.txt')
        console.log('')

        // Show first 15 in console
        console.log('Properties with -99 coordinates:')
        console.log('')
        invalid.slice(0, 15).forEach((p, i) => {
            console.log((i + 1) + '. ' + (p.property_name || 'N/A').substring(0, 50))
            console.log('   Address: ' + (p.address || 'N/A').substring(0, 55))
            console.log('   State: ' + (p.state || 'Unknown'))
            console.log('')
        })

        if (count > 15) {
            console.log('... and ' + (count - 15) + ' more (see full list in file)')
        }
    } else {
        console.log('')
        console.log('No properties with failed coordinates!')
    }
}

main()
