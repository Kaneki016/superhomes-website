/**
 * Check geocoding precision level for all properties
 * 
 * Analyzes address quality to estimate geocoding precision:
 * - High: Has street name/building name -> likely accurate
 * - Medium: Has area/township name -> city-level accuracy
 * - Low: Only state/city name -> state capital fallback
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Patterns that indicate address-level precision
const streetPatterns = [
    /jalan\s+\w+/i,           // Jalan (Road)
    /lorong\s+\w+/i,          // Lorong (Lane)
    /persiaran\s+\w+/i,       // Persiaran (Drive)
    /lebuh\s+\w+/i,           // Lebuh (Street)
    /tingkat\s+\w+/i,         // Tingkat (Level)
    /no\.\s*\d+/i,            // No. 123
    /\d+\w*,\s*jalan/i,       // Street number + Jalan
    /block\s+\w+/i,           // Block A/B/C
    /lot\s+\d+/i,             // Lot 123
    /unit\s+\d+/i,            // Unit 123
]

// Patterns that indicate township/area level (medium precision)
const areaPatterns = [
    /taman\s+\w+/i,           // Taman (Garden/Township)
    /bandar\s+\w+/i,          // Bandar (Town)
    /kampung\s+\w+/i,         // Kampung (Village)
    /seksyen\s+\d+/i,         // Seksyen (Section)
    /ss\s*\d+/i,              // SS (Subang Section)
    /usj\s*\d+/i,             // USJ
    /pj\s*\d+/i,              // PJ Section
    /setia\s+\w+/i,           // Setia Alam, Setia Eco, etc
    /bukit\s+\w+/i,           // Bukit (Hill)
    /puchong/i,
    /subang/i,
    /damansara/i,
    /mont\s*kiara/i,
    /bangsar/i,
    /cheras/i,
    /kepong/i,
    /ampang/i,
]

function analyzeAddressPrecision(address, state) {
    if (!address) return 'low'

    // Check for street-level indicators (HIGH precision)
    for (const pattern of streetPatterns) {
        if (pattern.test(address)) {
            return 'high'
        }
    }

    // Check for area/township indicators (MEDIUM precision)
    for (const pattern of areaPatterns) {
        if (pattern.test(address)) {
            return 'medium'
        }
    }

    // If address is just state name or very short, it's low precision
    if (!state) return 'low'
    if (address.toLowerCase().trim() === state.toLowerCase().trim()) return 'low'
    if (address.split(',').length <= 2 && address.length < 30) return 'low'

    // Has some address but not matching patterns - could be medium
    return 'medium'
}

async function main() {
    console.log('Analyzing geocoding precision for all properties...\n')

    const { data: properties, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .neq('latitude', -99)

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('Total properties:', properties.length)
    console.log('')

    const high = []
    const medium = []
    const low = []

    for (const prop of properties) {
        const precision = analyzeAddressPrecision(prop.address, prop.state)

        if (precision === 'high') {
            high.push(prop)
        } else if (precision === 'medium') {
            medium.push(prop)
        } else {
            low.push(prop)
        }
    }

    console.log('='.repeat(60))
    console.log('GEOCODING PRECISION ANALYSIS')
    console.log('='.repeat(60))
    console.log('')
    console.log('🟢 HIGH (street-level):', high.length, `(${(high.length / properties.length * 100).toFixed(1)}%)`)
    console.log('🟡 MEDIUM (township/area):', medium.length, `(${(medium.length / properties.length * 100).toFixed(1)}%)`)
    console.log('🔴 LOW (city/state only):', low.length, `(${(low.length / properties.length * 100).toFixed(1)}%)`)
    console.log('')

    // Sample of each category
    console.log('='.repeat(60))
    console.log('SAMPLE HIGH PRECISION ADDRESSES:')
    high.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${(p.address || 'N/A').substring(0, 60)}`)
    })

    console.log('')
    console.log('SAMPLE MEDIUM PRECISION ADDRESSES:')
    medium.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${(p.address || 'N/A').substring(0, 60)}`)
    })

    console.log('')
    console.log('SAMPLE LOW PRECISION ADDRESSES:')
    low.slice(0, 10).forEach((p, i) => {
        console.log(`${i + 1}. ${(p.address || 'N/A').substring(0, 60)}`)
    })

    // Save full lists
    const report = {
        summary: {
            total: properties.length,
            high: high.length,
            medium: medium.length,
            low: low.length
        },
        lowPrecision: low.map(p => ({
            id: p.id,
            name: p.property_name,
            address: p.address,
            state: p.state,
            lat: p.latitude,
            lon: p.longitude
        }))
    }

    fs.writeFileSync('scripts/precision_report.json', JSON.stringify(report, null, 2), 'utf8')
    console.log('')
    console.log('Full report saved to: scripts/precision_report.json')
}

main()
