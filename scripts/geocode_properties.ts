/**
 * Geocode Properties Script
 * 
 * This script geocodes all properties in the dup_properties table that don't have coordinates yet.
 * Uses Nominatim (OpenStreetMap) geocoding service - FREE and no API key required.
 * 
 * Usage:
 *   npx tsx scripts/geocode_properties.ts
 * 
 * Features:
 * - Rate limiting (1 request per second to respect Nominatim's usage policy)
 * - Error handling and retry logic
 * - Progress tracking
 * - Skips already geocoded properties
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Missing Supabase credentials in .env.local')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Property {
    id: string
    property_name: string
    address: string
    state: string | null
    latitude: number | null
    longitude: number | null
}

// Nominatim geocoding (free, no API key needed)
async function geocodeAddress(address: string, state: string | null): Promise<{ lat: number; lng: number } | null> {
    try {
        // Build search query: prioritize Malaysian addresses
        const searchQuery = state
            ? `${address}, ${state}, Malaysia`
            : `${address}, Malaysia`

        const encodedAddress = encodeURIComponent(searchQuery)
        const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=my`

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SuperHomes Property Marketplace (contact@superhomes.com)' // Required by Nominatim
            }
        })

        if (!response.ok) {
            console.error(`Geocoding failed for "${searchQuery}": ${response.status}`)
            return null
        }

        const data = await response.json()

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            }
        }

        console.warn(`No results found for: ${searchQuery}`)
        return null
    } catch (error) {
        console.error(`Error geocoding address "${address}":`, error)
        return null
    }
}

// Sleep function for rate limiting
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    console.log('🗺️  Starting property geocoding...\n')

    // Fetch all properties without valid coordinates (NULL only, skip failed ones marked -999)
    const { data: properties, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .is('latitude', null)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('❌ Error fetching properties:', error)
        return
    }

    if (!properties || properties.length === 0) {
        console.log('✅ All properties already have coordinates!')
        return
    }

    console.log(`📍 Found ${properties.length} properties to geocode\n`)

    let successCount = 0
    let failedCount = 0
    const failed: string[] = []

    for (let i = 0; i < properties.length; i++) {
        const property = properties[i] as Property
        const progress = `[${i + 1}/${properties.length}]`

        console.log(`${progress} Geocoding: ${property.property_name}`)
        console.log(`   Address: ${property.address}`)

        // Geocode the address
        const coords = await geocodeAddress(property.address, property.state)

        if (coords) {
            // Update the database with valid coordinates
            const { error: updateError } = await supabase
                .from('dup_properties')
                .update({
                    latitude: coords.lat,
                    longitude: coords.lng
                })
                .eq('id', property.id)

            if (updateError) {
                console.error(`   ❌ Failed to update: ${updateError.message}`)
                failedCount++
                failed.push(property.property_name)
            } else {
                console.log(`   ✅ Success: ${coords.lat}, ${coords.lng}`)
                successCount++
            }
        } else {
            // Mark as failed with special coordinates so we don't retry
            console.log(`   ⚠️  Could not geocode - marking as failed`)

            const { error: markError } = await supabase
                .from('dup_properties')
                .update({
                    latitude: -99, // Special marker for "geocoding failed" (fits DECIMAL(10,8))
                    longitude: -99
                })
                .eq('id', property.id)

            if (markError) {
                console.error(`   ❌ Failed to mark: ${markError.message}`)
            } else {
                failedCount++
                failed.push(property.property_name)
            }
        }

        // Rate limiting: Wait 1 second between requests (Nominatim policy)
        if (i < properties.length - 1) {
            await sleep(1000)
        }

        console.log('') // Empty line for readability
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Geocoding Summary')
    console.log('='.repeat(60))
    console.log(`✅ Successfully geocoded: ${successCount}`)
    console.log(`❌ Failed to geocode: ${failedCount}`)
    console.log(`📍 Total processed: ${properties.length}`)

    if (failed.length > 0) {
        console.log('\n⚠️  Failed properties:')
        failed.forEach(name => console.log(`   - ${name}`))
    }

    console.log('\n✨ Geocoding complete!')
}

// Run the script
main().catch(console.error)
