import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    // Simple fetch all properties
    const { data, error, count } = await supabase
        .from('properties')
        .select('*', { count: 'exact' })
        .limit(5)

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('Count:', count)
    console.log('Data length:', data?.length)

    if (data && data.length > 0) {
        console.log('')
        console.log('Sample property columns:', Object.keys(data[0]).join(', '))
        console.log('')
        console.log('Has latitude column:', 'latitude' in data[0])
        console.log('Has longitude column:', 'longitude' in data[0])

        if ('latitude' in data[0]) {
            // Check how many have null coords
            const { count: missingCount } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .or('latitude.is.null,longitude.is.null')

            const { count: hasCoords } = await supabase
                .from('properties')
                .select('*', { count: 'exact', head: true })
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)

            console.log('')
            console.log('=== SUMMARY ===')
            console.log('Total properties:', count)
            console.log('WITH coordinates:', hasCoords)
            console.log('MISSING coordinates:', missingCount)

            // Get the ones missing coordinates
            if (missingCount && missingCount > 0) {
                const { data: missingList } = await supabase
                    .from('properties')
                    .select('id, property_name, address, state, city')
                    .or('latitude.is.null,longitude.is.null')
                    .order('created_at', { ascending: false })
                    .limit(50)

                console.log('')
                console.log('=== PROPERTIES MISSING COORDINATES ===')
                missingList?.forEach((p, i) => {
                    const name = p.property_name || 'Unnamed'
                    const addr = p.address || 'No address'
                    console.log(`${i + 1}. ${name.substring(0, 60)}`)
                    console.log(`   Address: ${addr.substring(0, 60)}`)
                    console.log(`   Location: ${p.state || p.city || 'Unknown'}`)
                    console.log('')
                })
            }
        } else {
            console.log('')
            console.log('WARNING: latitude/longitude columns do not exist!')
            console.log('All', count, 'properties need geocoding once columns are added.')
        }
    } else {
        console.log('No properties found in database')
    }
}

main()
