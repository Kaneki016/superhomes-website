// Script to find and update properties without coordinates
// Run with: npx ts-node scripts/add-coordinates.ts

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Malaysian city/area coordinates lookup
const LOCATION_COORDS: { [key: string]: { lat: number; lng: number } } = {
    // Major Cities
    'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
    'petaling jaya': { lat: 3.1073, lng: 101.6067 },
    'shah alam': { lat: 3.0733, lng: 101.5185 },
    'subang jaya': { lat: 3.0567, lng: 101.5851 },
    'ampang': { lat: 3.1500, lng: 101.7667 },
    'cheras': { lat: 3.1073, lng: 101.7576 },
    'kepong': { lat: 3.2168, lng: 101.6346 },
    'setapak': { lat: 3.1833, lng: 101.7167 },
    'wangsa maju': { lat: 3.2000, lng: 101.7333 },
    'segambut': { lat: 3.1833, lng: 101.6667 },
    'bangsar': { lat: 3.1290, lng: 101.6716 },
    'mont kiara': { lat: 3.1710, lng: 101.6511 },
    'damansara': { lat: 3.1522, lng: 101.6268 },
    'damansara heights': { lat: 3.1522, lng: 101.6268 },
    'klcc': { lat: 3.1579, lng: 101.7119 },
    'bukit bintang': { lat: 3.1466, lng: 101.7108 },
    'sentul': { lat: 3.1833, lng: 101.6900 },
    'sri hartamas': { lat: 3.1629, lng: 101.6548 },
    'taman tun dr ismail': { lat: 3.1361, lng: 101.6336 },
    'ttdi': { lat: 3.1361, lng: 101.6336 },
    'desa parkcity': { lat: 3.1875, lng: 101.6312 },
    'cyberjaya': { lat: 2.9264, lng: 101.6424 },
    'putrajaya': { lat: 2.9264, lng: 101.6964 },
    'kajang': { lat: 2.9927, lng: 101.7909 },
    'semenyih': { lat: 2.9500, lng: 101.8500 },
    'rawang': { lat: 3.3214, lng: 101.5767 },
    'sungai buloh': { lat: 3.2081, lng: 101.5822 },
    'kota damansara': { lat: 3.1506, lng: 101.5833 },
    'bandar utama': { lat: 3.1333, lng: 101.6167 },
    'ara damansara': { lat: 3.1127, lng: 101.5821 },

    // Selangor Areas
    'klang': { lat: 3.0449, lng: 101.4455 },
    'puchong': { lat: 3.0333, lng: 101.6167 },
    'seri kembangan': { lat: 3.0253, lng: 101.7178 },
    'balakong': { lat: 3.0333, lng: 101.7500 },
    'setia alam': { lat: 3.1092, lng: 101.4269 },
    'bukit jelutong': { lat: 3.0983, lng: 101.5333 },
    'kota kemuning': { lat: 3.0000, lng: 101.5333 },
    'bangi': { lat: 2.9167, lng: 101.7667 },
    'sepang': { lat: 2.8000, lng: 101.7333 },
    'banting': { lat: 2.8167, lng: 101.5000 },
    'tropicana': { lat: 3.1350, lng: 101.5900 },
    'alam impian': { lat: 3.0661, lng: 101.4972 },
    'alam suria': { lat: 3.0783, lng: 101.4467 },
    'bukit rimau': { lat: 3.0497, lng: 101.4831 },

    // Penang
    'penang': { lat: 5.4141, lng: 100.3288 },
    'george town': { lat: 5.4141, lng: 100.3288 },
    'georgetown': { lat: 5.4141, lng: 100.3288 },
    'butterworth': { lat: 5.3992, lng: 100.3639 },
    'bayan lepas': { lat: 5.2983, lng: 100.2658 },
    'tanjung tokong': { lat: 5.4622, lng: 100.3014 },
    'gurney': { lat: 5.4383, lng: 100.3106 },
    'jelutong': { lat: 5.3700, lng: 100.3100 },
    'bukit mertajam': { lat: 5.3631, lng: 100.4589 },
    'batu ferringhi': { lat: 5.4700, lng: 100.2467 },
    'air itam': { lat: 5.4000, lng: 100.2833 },
    'relau': { lat: 5.3367, lng: 100.2833 },

    // Johor
    'johor bahru': { lat: 1.4927, lng: 103.7414 },
    'jb': { lat: 1.4927, lng: 103.7414 },
    'iskandar puteri': { lat: 1.4272, lng: 103.6311 },
    'nusajaya': { lat: 1.4272, lng: 103.6311 },
    'senai': { lat: 1.6333, lng: 103.6667 },
    'skudai': { lat: 1.5333, lng: 103.6667 },
    'kulai': { lat: 1.6500, lng: 103.6000 },
    'pasir gudang': { lat: 1.4667, lng: 103.9000 },
    'masai': { lat: 1.4847, lng: 103.8939 },
    'batu pahat': { lat: 1.8548, lng: 102.9325 },
    'muar': { lat: 2.0442, lng: 102.5689 },
    'kluang': { lat: 2.0333, lng: 103.3167 },
    'pontian': { lat: 1.4867, lng: 103.3900 },

    // Other States
    'ipoh': { lat: 4.5975, lng: 101.0901 },
    'malacca': { lat: 2.1896, lng: 102.2501 },
    'melaka': { lat: 2.1896, lng: 102.2501 },
    'seremban': { lat: 2.7297, lng: 101.9381 },
    'kuantan': { lat: 3.8077, lng: 103.3260 },
    'kota kinabalu': { lat: 5.9804, lng: 116.0735 },
    'kuching': { lat: 1.5535, lng: 110.3593 },
    'alor setar': { lat: 6.1248, lng: 100.3678 },
    'kangar': { lat: 6.4414, lng: 100.1986 },
    'kota bharu': { lat: 6.1256, lng: 102.2389 },
    'kuala terengganu': { lat: 5.3117, lng: 103.1324 },

    // Langkawi & Islands
    'langkawi': { lat: 6.3500, lng: 99.8000 },
    'tioman': { lat: 2.7833, lng: 104.1500 },
    'labuan': { lat: 5.2831, lng: 115.2308 },

    // Kedah
    'sungai petani': { lat: 5.6472, lng: 100.4883 },
    'kulim': { lat: 5.3667, lng: 100.5500 },
    'kuah': { lat: 6.3167, lng: 99.8333 },

    // Sabah
    'sandakan': { lat: 5.8394, lng: 118.1172 },
    'tawau': { lat: 4.2500, lng: 117.8833 },
    'keningau': { lat: 5.3333, lng: 116.1667 },

    // Sarawak
    'miri': { lat: 4.3995, lng: 113.9914 },
    'sibu': { lat: 2.2878, lng: 111.8308 },
    'bintulu': { lat: 3.1667, lng: 113.0333 },
}

// State capital fallbacks
const STATE_COORDS: { [key: string]: { lat: number; lng: number } } = {
    'selangor': { lat: 3.0738, lng: 101.5183 },
    'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
    'penang': { lat: 5.4141, lng: 100.3288 },
    'johor': { lat: 1.4927, lng: 103.7414 },
    'perak': { lat: 4.5975, lng: 101.0901 },
    'kedah': { lat: 6.1248, lng: 100.3678 },
    'kelantan': { lat: 6.1256, lng: 102.2389 },
    'terengganu': { lat: 5.3117, lng: 103.1324 },
    'pahang': { lat: 3.8077, lng: 103.3260 },
    'negeri sembilan': { lat: 2.7297, lng: 101.9381 },
    'melaka': { lat: 2.1896, lng: 102.2501 },
    'perlis': { lat: 6.4414, lng: 100.1986 },
    'sabah': { lat: 5.9804, lng: 116.0735 },
    'sarawak': { lat: 1.5535, lng: 110.3593 },
    'putrajaya': { lat: 2.9264, lng: 101.6964 },
    'labuan': { lat: 5.2831, lng: 115.2308 },
}

function findCoordinates(address: string, state?: string): { lat: number; lng: number } | null {
    const lowerAddress = address.toLowerCase()
    const lowerState = state?.toLowerCase() || ''

    // Search for known locations in the address
    for (const [location, coords] of Object.entries(LOCATION_COORDS)) {
        if (lowerAddress.includes(location)) {
            // Add small random offset to avoid stacking markers
            return {
                lat: coords.lat + (Math.random() - 0.5) * 0.01,
                lng: coords.lng + (Math.random() - 0.5) * 0.01
            }
        }
    }

    // Fallback to state capital
    for (const [stateName, coords] of Object.entries(STATE_COORDS)) {
        if (lowerAddress.includes(stateName) || lowerState.includes(stateName)) {
            return {
                lat: coords.lat + (Math.random() - 0.5) * 0.02,
                lng: coords.lng + (Math.random() - 0.5) * 0.02
            }
        }
    }

    return null
}

async function main() {
    console.log('🔍 Checking for properties without coordinates...\n')

    // Get properties without valid coordinates
    const { data: properties, error } = await supabase
        .from('dup_properties')
        .select('id, property_name, address, state, latitude, longitude')
        .or('latitude.is.null,longitude.is.null,latitude.eq.-99,longitude.eq.-99')

    if (error) {
        console.error('Error fetching properties:', error)
        return
    }

    if (!properties || properties.length === 0) {
        console.log('✅ All properties already have coordinates!')
        return
    }

    console.log(`Found ${properties.length} properties without coordinates:\n`)

    const updates: { id: string; latitude: number; longitude: number; address: string }[] = []

    for (const property of properties) {
        console.log(`- ${property.property_name || 'Unnamed'}`)
        console.log(`  Address: ${property.address}`)
        console.log(`  State: ${property.state || 'N/A'}`)

        const coords = findCoordinates(property.address || '', property.state)

        if (coords) {
            console.log(`  ✅ Found coords: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
            updates.push({
                id: property.id,
                latitude: coords.lat,
                longitude: coords.lng,
                address: property.address
            })
        } else {
            console.log(`  ❌ Could not find coordinates`)
        }
        console.log()
    }

    if (updates.length === 0) {
        console.log('No coordinates could be determined for any properties.')
        return
    }

    console.log(`\n📝 Ready to update ${updates.length} properties.`)
    console.log('Run with --update flag to apply changes.\n')

    // Check for --update flag
    if (process.argv.includes('--update')) {
        console.log('Updating properties...\n')

        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('dup_properties')
                .update({
                    latitude: update.latitude,
                    longitude: update.longitude
                })
                .eq('id', update.id)

            if (updateError) {
                console.log(`❌ Failed to update ${update.id}: ${updateError.message}`)
            } else {
                console.log(`✅ Updated: ${update.address?.substring(0, 50)}...`)
            }
        }

        console.log('\n✅ Done!')
    }
}

main().catch(console.error)
