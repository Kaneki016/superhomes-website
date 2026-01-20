
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const MALAYSIA_BOUNDS = {
    minLat: 0.8,
    maxLat: 7.4,
    minLon: 99.5,
    maxLon: 119.5
}

async function main() {
    console.log('🕵️  Verifying Transaction Geocoding by District...\n')

    // 1. Fetch all geocoded transactions
    const { data: rows, error } = await supabase
        .from('transactions')
        .select('district, latitude, longitude')
        .neq('latitude', -99)
        .not('latitude', 'is', null)

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    if (!rows || rows.length === 0) {
        console.log('No geocoded transactions found.')
        return
    }

    console.log(`Analyzing ${rows.length} transactions...`)

    // 2. Group by district and collect unique coordinates
    const districtMap: Record<string, Set<string>> = {}
    const districtCounts: Record<string, number> = {}

    for (const row of rows) {
        const district = row.district ? row.district.trim() : '(No District)'
        const coordKey = `${row.latitude},${row.longitude}`

        if (!districtMap[district]) {
            districtMap[district] = new Set()
            districtCounts[district] = 0
        }
        districtMap[district].add(coordKey)
        districtCounts[district]++
    }

    // 3. Analyze results
    console.log('\n--- District Report ---\n')
    
    const table: any[] = []
    let suspiciousCount = 0

    for (const district of Object.keys(districtMap).sort()) {
        const coords = Array.from(districtMap[district])
        const count = districtCounts[district]
        
        // For simplicity, take the first coordinate pair to check bounds
        // (If there are multiple, it means mixed geocoding, which we'll note)
        const [latStr, lonStr] = coords[0].split(',')
        const lat = parseFloat(latStr)
        const lon = parseFloat(lonStr)

        const isInsideMalaysia = 
            lat >= MALAYSIA_BOUNDS.minLat && 
            lat <= MALAYSIA_BOUNDS.maxLat && 
            lon >= MALAYSIA_BOUNDS.minLon && 
            lon <= MALAYSIA_BOUNDS.maxLon

        let status = '✅ OK'
        if (!isInsideMalaysia) {
            status = '❌ Out of Bounds'
            suspiciousCount++
        } else if (coords.length > 1) {
            status = '⚠️  Multiple Coords'
        }

        table.push({
            District: district,
            TxCount: count,
            UniqueLocs: coords.length,
            ExampleLat: lat.toFixed(4),
            ExampleLon: lon.toFixed(4),
            Status: status,
            MapLink: `https://www.google.com/maps?q=${lat},${lon}`
        })
    }

    // Sort by status (problems first), then count
    table.sort((a, b) => {
        if (a.Status.includes('❌') && !b.Status.includes('❌')) return -1
        if (!a.Status.includes('❌') && b.Status.includes('❌')) return 1
        return b.TxCount - a.TxCount
    })

    console.table(table.map(({ MapLink, ...rest }) => rest)) // Hide excessive link length in console table

    console.log(`\nFound ${suspiciousCount} potentially incorrect districts out of ${table.length}.`)
    console.log('Review the table above. "Multiple Coords" means a district has varying locations (which might be fine if properties are individually geocoded).')
    
    // Output full list with links for the user
    if (suspiciousCount > 0) {
        console.log('\n--- Suspicious Locations Links ---')
        table.filter(r => r.Status.includes('❌')).forEach(r => {
            console.log(`${r.District}: ${r.MapLink}`)
        })
    }
}

main()
