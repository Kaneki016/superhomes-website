const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
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

    const lines = []
    lines.push('='.repeat(60))
    lines.push('DUP_PROPERTIES - FAILED GEOCODING REPORT')
    lines.push('Generated: ' + new Date().toISOString())
    lines.push('='.repeat(60))
    lines.push('')
    lines.push('SUMMARY:')
    lines.push('  Total properties: ' + total)
    lines.push('  Valid coordinates: ' + (total - count))
    lines.push('  Failed geocoding (-99): ' + count)
    lines.push('')
    lines.push('='.repeat(60))

    if (invalid && invalid.length > 0) {
        lines.push('')
        lines.push('PROPERTIES WITH FAILED GEOCODING (-99 coordinates):')
        lines.push('')
        invalid.forEach((p, i) => {
            lines.push((i + 1) + '. ' + (p.property_name || 'No name'))
            lines.push('   ID: ' + p.id)
            lines.push('   Address: ' + (p.address || 'N/A'))
            lines.push('   State: ' + (p.state || p.city || 'Unknown'))
            lines.push('')
        })
    }

    fs.writeFileSync('scripts/failed_geocoding_report.txt', lines.join('\n'), 'utf8')
    console.log('Report saved to: scripts/failed_geocoding_report.txt')
    console.log('Total failed geocoding:', count)
}

main()
