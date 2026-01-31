// Script to reset coordinates set by the lookup table and re-run proper geocoding
// Run with: npx tsx scripts/reset-and-regeocode.ts

// Script to reset coordinates set by the lookup table and re-run proper geocoding
// Run with: npx tsx scripts/reset-and-regeocode.ts

import { config } from 'dotenv'
import * as path from 'path'
import postgres from 'postgres'

// Load environment variables
config({ path: path.resolve(__dirname, '../.env.local') })

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

async function main() {
    console.log('🔄 Resetting coordinates for properties that need re-geocoding...\n')

    try {
        const [countResult] = await sql`
            SELECT count(*) 
            FROM dup_properties 
            WHERE latitude IS NOT NULL 
            AND latitude != -99
        `
        const count = countResult.count

        console.log(`Total properties with coordinates: ${count}`)

        // Reset recently added coordinates (from last script run - 30 minutes ago)
        const toReset = await sql`
            SELECT id, property_name, address, latitude, longitude, updated_at
            FROM dup_properties
            WHERE latitude IS NOT NULL 
            AND latitude != -99
            AND updated_at > NOW() - INTERVAL '30 minutes'
            ORDER BY updated_at DESC
        `

        if (toReset.length === 0) {
            console.log('No recently modified properties found to reset.')
            console.log('\nRunning geocode script for any NULL coordinates...')
            return
        }

        console.log(`Found ${toReset.length} properties to reset to NULL for re-geocoding.\n`)

        // Reset coordinates to NULL
        for (const prop of toReset) {
            try {
                await sql`
                    UPDATE dup_properties 
                    SET latitude = NULL, longitude = NULL 
                    WHERE id = ${prop.id}
                `
                console.log(`✅ Reset: ${prop.property_name?.substring(0, 50)}...`)
            } catch (updateError: any) {
                console.log(`❌ Failed to reset ${prop.property_name}: ${updateError.message}`)
            }
        }

        console.log(`\n✅ Reset ${toReset.length} properties. Now run: npx tsx scripts/geocode_properties.ts`)
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sql.end()
    }
}

main().catch(console.error)
