/**
 * Geocode Properties Script
 * 
 * This script geocodes all properties in the dup_properties table that don't have coordinates yet.
 * Uses a dual-strategy approach for maximum success rate:
 * 1. Tries Nominatim (OpenStreetMap) first - FREE, no API key required
 * 2. Falls back to Google Maps Geocoding API if Nominatim fails - Requires GOOGLE_MAPS_API_KEY
 * 
 * Usage:
 *   npx tsx scripts/geocode_properties.ts              # Geocode properties with NULL coordinates
 *   npx tsx scripts/geocode_properties.ts --retry-failed # Retry properties marked as failed (-99)
 * 
 * Features:
 * - Rate limiting (1 request per second to respect Nominatim's usage policy)
 * - Automatic fallback to Google Maps API for better accuracy
 * - Error handling and retry logic
 * - Progress tracking with service source indication
 * - Can retry previously failed properties with --retry-failed flag
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
let googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY

// Fallback: Try reading from file if env variable not found
if (!googleMapsApiKey) {
    try {
        const keyPath = join(__dirname, 'google_api_key.txt')
        googleMapsApiKey = readFileSync(keyPath, 'utf-8').trim()
        console.log('📝 Loaded Google Maps API key from google_api_key.txt')
    } catch {
        // File doesn't exist or can't be read
    }
}

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Error: Missing Supabase credentials in .env.local')
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check if Google Maps API is available
if (googleMapsApiKey) {
    console.log('✅ Google Maps API key detected - will use as fallback for failed geocoding')
} else {
    console.log('⚠️  No Google Maps API key - using Nominatim only')
}

interface Property {
    id: string
    property_name: string
    address: string
    state: string | null
    latitude: number | null
    longitude: number | null
}

// Nominatim geocoding (free, no API key needed)
async function geocodeWithNominatim(address: string, state: string | null): Promise<{ lat: number; lng: number } | null> {
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
            return null
        }

        const data = await response.json()

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            }
        }

        return null
    } catch (error) {
        console.error(`Nominatim error:`, error)
        return null
    }
}

// Google Maps Geocoding API (paid but very accurate)
async function geocodeWithGoogleMaps(address: string, state: string | null): Promise<{ lat: number; lng: number } | null> {
    if (!googleMapsApiKey) {
        return null
    }

    try {
        const searchQuery = state
            ? `${address}, ${state}, Malaysia`
            : `${address}, Malaysia`

        const encodedAddress = encodeURIComponent(searchQuery)
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&region=my&key=${googleMapsApiKey}`

        const response = await fetch(url)

        if (!response.ok) {
            return null
        }

        const data = await response.json()

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location
            return {
                lat: location.lat,
                lng: location.lng
            }
        }

        return null
    } catch (error) {
        console.error(`Google Maps API error:`, error)
        return null
    }
}

// Main geocoding function with fallback strategy
async function geocodeAddress(address: string, state: string | null): Promise<{ lat: number; lng: number; source: string } | null> {
    // Try Nominatim first (free)
    console.log(`   🔍 Trying Nominatim...`)
    const nominatimResult = await geocodeWithNominatim(address, state)

    if (nominatimResult) {
        return { ...nominatimResult, source: 'Nominatim' }
    }

    // If Nominatim fails and Google Maps API is available, try it
    if (googleMapsApiKey) {
        console.log(`   🔍 Nominatim failed, trying Google Maps API...`)
        const googleResult = await geocodeWithGoogleMaps(address, state)

        if (googleResult) {
            return { ...googleResult, source: 'Google Maps' }
        }
    }

    // Both failed
    const searchQuery = state ? `${address}, ${state}, Malaysia` : `${address}, Malaysia`
    console.warn(`   ⚠️  No results from any service for: ${searchQuery}`)
    return null
}

// Sleep function for rate limiting
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
    console.log('🗺️  Starting property geocoding...\n')

    // Check if we should retry failed properties
    const retryFailed = process.argv.includes('--retry-failed')

    let query = supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')

    if (retryFailed) {
        // Retry properties marked as failed (-99)
        console.log('🔄 Mode: Retrying previously failed properties (latitude = -99)\n')
        query = query.eq('latitude', -99)
    } else {
        // Default: Only geocode properties with NULL coordinates
        console.log('📍 Mode: Geocoding new properties (latitude = NULL)\n')
        console.log('💡 Tip: Use --retry-failed flag to retry properties with -99 coordinates\n')
        query = query.is('latitude', null)
    }

    // Fetch properties
    const { data: properties, error } = await query.order('created_at', { ascending: true })

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
                console.log(`   ✅ Success [${coords.source}]: ${coords.lat}, ${coords.lng}`)
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
