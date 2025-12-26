import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    // Get total count
    const { count: total } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })

    // Get properties with coordinates
    const { data: withCoords } = await supabase
        .from('properties')
        .select('id')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

    // Get properties without coordinates
    const { data: missing, error } = await supabase
        .from('properties')
        .select('id, property_name, address, state, city')
        .or('latitude.is.null,longitude.is.null')

    if (error) {
        // If latitude column doesn't exist, try without it
        const { data: allProps } = await supabase
            .from('properties')
            .select('id, property_name, address, state, city')

        console.log('LATITUDE/LONGITUDE COLUMNS MAY NOT EXIST')
        console.log('Total properties:', allProps?.length || 0)
        console.log('ALL properties need geocoding')
        console.log('')
        console.log('First 20 properties:')
        allProps?.slice(0, 20).forEach((p, i) => {
            console.log(`${i + 1}. ${p.property_name?.substring(0, 50) || 'N/A'}`)
            console.log(`   ${p.address?.substring(0, 60) || 'No address'}`)
            console.log(`   State: ${p.state || p.city || 'Unknown'}`)
        })
        return
    }

    console.log('=== COORDINATE STATUS REPORT ===')
    console.log('')
    console.log(`Total properties: ${total}`)
    console.log(`With coordinates: ${withCoords?.length || 0}`)
    console.log(`Missing coordinates: ${missing?.length || 0}`)
    console.log('')

    if (missing && missing.length > 0) {
        console.log('Properties missing coordinates:')
        console.log('')
        missing.forEach((p, i) => {
            console.log(`${i + 1}. ${p.property_name?.substring(0, 50) || 'N/A'}`)
            console.log(`   Address: ${p.address?.substring(0, 60) || 'N/A'}`)
            console.log(`   State: ${p.state || p.city || 'Unknown'}`)
            console.log('')
        })
    }
}

main()
