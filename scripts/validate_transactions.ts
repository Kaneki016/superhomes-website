
/**
 * Validate Transactions Geocoding
 * 
 * Checks for:
 * 1. Coordinates outside Malaysia
 * 2. Suspiciously frequent coordinates (potential defaults)
 */

import { config } from 'dotenv'
import postgres from 'postgres'
import fs from 'fs'

config({ path: '.env.local' })

const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? 'require' : undefined,
}

// Use DATABASE_URL if available
const sql = process.env.DATABASE_URL
    ? postgres(process.env.DATABASE_URL, { ssl: 'require' })
    : postgres(dbConfig as any)

// Malaysia Bounding Box (Roughly)
const BOUNDS = {
    minLat: 0.8, maxLat: 7.5,
    minLon: 99.5, maxLon: 119.5
}

async function main() {
    console.log('🔍 Validating Transactions Geocoding...\n')

    try {
        const data = await sql`
            SELECT id, address, latitude, longitude 
            FROM transactions
            WHERE latitude IS NOT NULL 
            AND latitude != -99
        `

        console.log(`Checking ${data.length} records...`)

        let outsideBounds = 0
        let suspicious = 0
        const coordCounts: Record<string, number> = {}
        const badRecords: any[] = []

        for (const row of data) {
            const key = `${row.latitude},${row.longitude}`
            coordCounts[key] = (coordCounts[key] || 0) + 1

            const { latitude: lat, longitude: lng } = row

            // Check 1: Out of bounds
            if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLon || lng > BOUNDS.maxLon) {
                outsideBounds++
                badRecords.push({ reason: 'Out of Bounds', ...row })
            }
        }

        // Check 2: Frequent Coordinates (likely defaults/city centers)
        const FREQ_THRESHOLD = 50 // If >50 properties share exact coords, suspect generic center
        for (const [key, count] of Object.entries(coordCounts)) {
            if (count > FREQ_THRESHOLD) {
                suspicious += count
                // Add a sample of these to report
                console.log(`⚠️  Suspicious Cluster: ${count} records at [${key}]`)
            }
        }

        console.log('\nResults:')
        console.log(`✅ Valid Range: ${data.length - outsideBounds}`)
        console.log(`❌ Out of Bounds: ${outsideBounds}`)
        console.log(`⚠️  Suspicious Clusters: ${suspicious} records involved`)

        if (badRecords.length > 0) {
            console.log('\nSample Out-of-Bounds Records:')
            badRecords.slice(0, 5).forEach(r => {
                console.log(`- [${r.latitude}, ${r.longitude}] ${r.address}`)
            })
        }
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sql.end()
    }
}

main()
