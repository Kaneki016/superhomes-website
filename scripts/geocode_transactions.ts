/**
 * Geocode Transactions Script
 * 
 * Geocodes the 'transactions' table using the 'address' column.
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

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Nominatim (Free)
async function geocodeNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const query = encodeURIComponent(`${address}, Malaysia`)
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=my`

        const res = await fetch(url, {
            headers: { 'User-Agent': 'SuperHomes Transactions Geocoder' }
        })

        if (!res.ok) return null
        const data = await res.json()

        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        }
        return null
    } catch (e) {
        return null
    }
}

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
    console.log('🗺️  Geocoding "transactions" table...\n')

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

        // Fetch a batch
        const { data: rows, error } = await query.limit(100)

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
            process.stdout.write(`Processing: ${row.address?.substring(0, 30)}... `)

            if (!row.address) {
                console.log('❌ No address')
                continue
            }

            // Try Nominatim
            let coords = await geocodeNominatim(row.address)
            let source = 'Nominatim'

            // Try Google if Nominatim failed
            if (!coords && googleMapsApiKey) {
                coords = await geocodeGoogle(row.address)
                source = 'Google'
            }

            if (coords) {
                await supabase.from('transactions').update({
                    latitude: coords.lat,
                    longitude: coords.lng
                }).eq('id', row.id)
                console.log(`✅ ${source} (${coords.lat}, ${coords.lng})`)
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

            // Rate limit
            await new Promise(r => setTimeout(r, 1000))
        }
    }

    console.log(`\nDone! Total Success: ${totalSuccess}, Total Failed: ${totalFailed}`)
}

main()
