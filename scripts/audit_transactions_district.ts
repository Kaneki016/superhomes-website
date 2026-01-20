
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Haversine formula for distance in km
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

async function main() {
    console.log('🕵️  Auditing Transaction Locations vs District Centers...\n')

    // 1. Fetch all transactions with coords and district
    const { data: rows, error } = await supabase
        .from('transactions')
        .select('id, district, latitude, longitude')
        .neq('latitude', -99)
        .not('latitude', 'is', null)
        .not('district', 'is', null)

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    console.log(`Analyzing ${rows?.length} transactions...`)

    // 2. Identify unique districts
    const uniqueDistricts = [...new Set(rows!.map(r => r.district.trim()))].sort()
    console.log(`Found ${uniqueDistricts.length} unique districts. Fetching centers...`)

    const districtCenters: Record<string, { lat: number, lon: number }> = {}

    // 3. Fetch district centers
    for (const district of uniqueDistricts) {
        if (!district) continue

        const cleanDistrict = district.replace(/\s*District\s*/i, '').trim()

        try {
            const query = encodeURIComponent(`${cleanDistrict}, Malaysia`)
            const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=my`

            const res = await fetch(url, { headers: { 'User-Agent': 'SuperHomes Audit Script' } })
            if (res.ok) {
                const data = await res.json()
                if (data && data.length > 0) {
                    districtCenters[district] = {
                        lat: parseFloat(data[0].lat),
                        lon: parseFloat(data[0].lon)
                    }
                    process.stdout.write('.')
                } else {
                    process.stdout.write('x')
                }
            } else {
                process.stdout.write('E')
            }
        } catch (e) {
            process.stdout.write('e')
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 1100))
    }
    console.log('\nCenters fetched.\n')

    // 4. Validate distances
    const report: any[] = []
    let totalBad = 0

    for (const district of uniqueDistricts) {
        const center = districtCenters[district]
        if (!center) {
            report.push({ District: district, Status: '⚠️ Center Not Found', Count: 0, Bad: 0 })
            continue
        }

        const txs = rows!.filter(r => r.district.trim() === district)
        let badCount = 0

        const badIds: string[] = []

        for (const tx of txs) {
            const dist = getDistanceFromLatLonInKm(
                center.lat, center.lon,
                tx.latitude, tx.longitude
            )

            // Threshold: 50km (Districts can be large, but usually points should be within 50km of center)
            if (dist > 50) {
                badCount++
                badIds.push(tx.id)
            }
        }

        totalBad += badCount
        const status = badCount === 0 ? '✅ OK' : `❌ ${badCount} Bad`

        report.push({
            District: district,
            Status: status,
            Count: txs.length,
            Bad: badCount,
            PercentBad: ((badCount / txs.length) * 100).toFixed(1) + '%'
        })
    }

    // Sort report
    report.sort((a, b) => b.Bad - a.Bad)

    console.table(report)
    console.log(`\nTotal potentially mis-located transactions: ${totalBad}`)

    // Create a fix list
    // We can't auto-fix, but we can list them or offer to "reset" them to district center (which is repair logic)
    if (totalBad > 0) {
        console.log('To repair these, we might want to reset their coordinates to the district center (or -99 to re-geocode).')
    }
}

main()
