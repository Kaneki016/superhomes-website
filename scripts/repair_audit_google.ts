
/**
 * Repair Audit Google
 * 
 * 1. Audits transactions to find those far from their district center.
 * 2. Re-geocodes them using Google Maps API.
 */

import { config } from 'dotenv'
import { config } from 'dotenv'
import postgres from 'postgres'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

let googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

// Fallback logic for API key
if (!googleMapsApiKey) {
    try {
        const keyPath = join(__dirname, 'google_api_key.txt')
        googleMapsApiKey = readFileSync(keyPath, 'utf-8').trim()
    } catch { }
}

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

const sql = process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, { ssl: 'require' })
    : postgres(dbConfig as any)

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

async function geocodeGoogle(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!googleMapsApiKey) return null
    try {
        const query = encodeURIComponent(`${address}, Malaysia`)
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&region=my&key=${googleMapsApiKey}`

        const res = await fetch(url)
        if (!res.ok) return null
        const data = await res.json()

        if (data.status === 'OK' && data.results.length > 0) {
            const loc = data.results[0].geometry.location
            return { lat: loc.lat, lng: loc.lng }
        }
        return null
    } catch (e) {
        return null
    }
}

async function main() {
    console.log('🕵️  Starting Audit & Repair (Google Maps)...\n')

    try {
        // 1. Fetch Data
        const rows = await sql`
            SELECT id, district, address, latitude, longitude 
            FROM transactions
            WHERE latitude != -99
            AND latitude IS NOT NULL 
            AND district IS NOT NULL
        `

        if (!rows || rows.length === 0) {
            console.error('Error fetching data or no data found.')
            return
        }

        // 2. Prepare District Centers
        const uniqueDistricts = [...new Set(rows.map(r => r.district.trim()))].sort()
        const districtCenters: Record<string, { lat: number, lon: number }> = {}

        console.log(`Fetching centers for ${uniqueDistricts.length} districts...`)

        for (const district of uniqueDistricts) {
            const cleanDistrict = district.replace(/\s*District\s*/i, '').trim()
            try {
                const query = encodeURIComponent(`${cleanDistrict}, Malaysia`)
                const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=my`
                const res = await fetch(url, { headers: { 'User-Agent': 'SuperHomes Repair' } })
                if (res.ok) {
                    const data = await res.json()
                    if (data && data.length > 0) {
                        districtCenters[district] = {
                            lat: parseFloat(data[0].lat),
                            lon: parseFloat(data[0].lon)
                        }
                    }
                }
            } catch { }
            await new Promise(r => setTimeout(r, 600)) // Gentle rate limit
            process.stdout.write('.')
        }
        console.log('\nCenters fetched.\n')

        // 3. Identify and Repair Bad Transactions
        let repaired = 0
        let stillFailed = 0
        let skipped = 0

        for (const tx of rows) {
            const district = tx.district.trim()
            const center = districtCenters[district]

            if (!center) {
                skipped++
                continue
            }

            const dist = getDistanceFromLatLonInKm(center.lat, center.lon, tx.latitude, tx.longitude)

            // If distance > 50km, it's likely wrong
            if (dist > 50) {
                process.stdout.write(`Reparing ID ${tx.id} (${Math.round(dist)}km off)... `)

                // Try Google Geocode
                const newCoords = await geocodeGoogle(tx.address || (district + ', Malaysia'))

                if (newCoords) {
                    // Check if new coords are better? 
                    // Google is usually trusted, but let's just update.

                    await sql`
                        UPDATE transactions 
                        SET latitude = ${newCoords.lat}, longitude = ${newCoords.lng} 
                        WHERE id = ${tx.id}
                    `

                    console.log(`✅ Fixed: (${newCoords.lat}, ${newCoords.lng})`)
                    repaired++
                } else {
                    console.log(`❌ Google Failed`)
                    stillFailed++
                }

                // Delay for Google API limit safety (though 50 QPS is usually fine)
                await new Promise(r => setTimeout(r, 100))
            }
        }

        console.log('\nCannot calculate distance (Missing Center):', skipped)
        console.log('Repaired:', repaired)
        console.log('Failed to Repair:', stillFailed)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sql.end()
    }
}

main()
