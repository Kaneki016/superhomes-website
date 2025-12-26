import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMissingCoordinates() {
    console.log('🔍 Checking properties...\n')

    // First, get all properties to see what columns exist
    const { data: properties, error, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .limit(200)

    if (error) {
        console.error('❌ Error fetching properties:', error.message)
        return
    }

    console.log(`📊 Total properties fetched: ${properties?.length || 0}`)

    if (properties && properties.length > 0) {
        // Check if latitude/longitude columns exist
        const sampleProperty = properties[0]
        const hasCoordColumns = 'latitude' in sampleProperty && 'longitude' in sampleProperty

        console.log(`\n📋 Columns in properties table:`)
        console.log(Object.keys(sampleProperty).join(', '))

        if (hasCoordColumns) {
            const missingCoords = properties.filter(p => p.latitude === null || p.longitude === null)
            const withCoords = properties.filter(p => p.latitude !== null && p.longitude !== null)

            console.log(`\n📊 Summary:`)
            console.log(`   Total properties: ${properties.length}`)
            console.log(`   Missing coordinates: ${missingCoords.length}`)
            console.log(`   With coordinates: ${withCoords.length}`)

            if (missingCoords.length > 0) {
                console.log('\n' + '='.repeat(80))
                console.log('\n📋 Properties MISSING coordinates:\n')
                missingCoords.forEach((prop, index) => {
                    console.log(`${index + 1}. ${prop.property_name || prop.title || 'Unnamed'}`)
                    console.log(`   ID: ${prop.id}`)
                    console.log(`   Address: ${prop.address || 'No address'}`)
                    console.log(`   State: ${prop.state || 'Unknown'}`)
                    console.log('')
                })
            }
        } else {
            console.log('\n⚠️ latitude/longitude columns do NOT exist in the properties table!')
            console.log('All properties are missing coordinates because the columns have not been added yet.')

            console.log('\n📋 First 10 properties (without coords):')
            properties.slice(0, 10).forEach((prop, index) => {
                console.log(`${index + 1}. ${prop.property_name || prop.title || 'Unnamed'}`)
                console.log(`   ID: ${prop.id}`)
                console.log(`   Address: ${prop.address || 'No address'}`)
                console.log('')
            })
        }
    } else {
        console.log('No properties found in database.')
    }
}

checkMissingCoordinates()
