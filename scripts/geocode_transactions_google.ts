
/**
 * Geocode Transactions Script (Google Maps Exclusive - Reverse Order)
 * 
 * Geocodes the 'transactions' table using ONLY Google Maps API.
 * Processes in DESCENDING order to allow parallel execution with the main script.
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
let googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

// Fallback: Try reading from file if env variable not found
if (!googleMapsApiKey) {
    try {
        const keyPath = join(__dirname, 'google_api_key.txt')
        googleMapsApiKey = readFileSync(keyPath, 'utf-8').trim()
    } catch { }
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

if (!googleMapsApiKey) {
    console.error('❌ Missing Google Maps API Key. This script requires it.')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Google Maps (Paid/Fallback)
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
    console.log('🚀 Accelerating Geocoding (Google Maps Only - Reversing)...\n')

    // Check mode
    const retryFailed = process.argv.includes('--retry-failed')

    let totalSuccess = 0
    let totalFailed = 0

    while (true) {
        let query = supabase.from('transactions').select('id, address, latitude, longitude')

        if (retryFailed) {
            query = query.eq('latitude', -99)
        } else {
            query = query.is('latitude', null)
        }

        // Fetch a batch in DESCENDING order to work from the other end of the list
        const { data: rows, error } = await query.order('id', { ascending: false }).limit(100)

        if (error) {
            console.error('Error fetching data:', error)
            break
        }

        if (!rows || rows.length === 0) {
            if (totalSuccess + totalFailed === 0) {
                console.log('✅ No properties to geocode.')
            } else {
                console.log('✅ All pending properties processed.')
            }
            break
        }

        console.log(`\nProcessing batch of ${rows.length}...`)

        for (const row of rows) {
            process.stdout.write(`Google Processing: ${row.address?.substring(0, 30)}... `)

            if (!row.address) {
                console.log('❌ No address')
                continue
            }

            // Only use Google Maps
            const coords = await geocodeGoogle(row.address)

            if (coords) {
                await supabase.from('transactions').update({
                    latitude: coords.lat,
                    longitude: coords.lng
                }).eq('id', row.id)
                console.log(`✅ Google (${coords.lat}, ${coords.lng})`)
                totalSuccess++
            } else {
                // Mark as failed
                await supabase.from('transactions').update({
                    latitude: -99,
                    longitude: -99
                }).eq('id', row.id)
                console.log('❌ Failed')
                totalFailed++
            }

            // Minimal delay to be polite, but much faster than 1s
            await new Promise(r => setTimeout(r, 100))
        }
    }

    console.log(`\nDone! Total Success: ${totalSuccess}, Total Failed: ${totalFailed}`)
}

main()
