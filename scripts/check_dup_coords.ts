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
    // Query dup_properties table
    const { data, error, count } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact' })
        .limit(5)

    if (error) {
        console.log('Error:', error.message)
        return
    }

    console.log('=== DUP_PROPERTIES TABLE ===')
    console.log('Total count:', count)
    console.log('Sample data length:', data?.length)

    if (data && data.length > 0) {
        console.log('')
        console.log('Columns:', Object.keys(data[0]).join(', '))
        console.log('')
        console.log('Has latitude:', 'latitude' in data[0])
        console.log('Has longitude:', 'longitude' in data[0])

        if ('latitude' in data[0]) {
            const { count: missingCount } = await supabase
                .from('dup_properties')
                .select('*', { count: 'exact', head: true })
                .or('latitude.is.null,longitude.is.null')

            const { count: hasCoords } = await supabase
                .from('dup_properties')
                .select('*', { count: 'exact', head: true })
                .not('latitude', 'is', null)
                .not('longitude', 'is', null)

            console.log('')
            console.log('=== SUMMARY ===')
            console.log('Total:', count)
            console.log('WITH coords:', hasCoords)
            console.log('MISSING coords:', missingCount)

            if (missingCount && missingCount > 0) {
                const { data: missingList } = await supabase
                    .from('dup_properties')
                    .select('id, property_name, address, state, city')
                    .or('latitude.is.null,longitude.is.null')
                    .limit(30)

                console.log('')
                console.log('=== MISSING COORDINATES (first 30) ===')
                missingList?.forEach((p, i) => {
                    console.log(`${i + 1}. ${(p.property_name || 'N/A').substring(0, 55)}`)
                    console.log(`   ${(p.address || 'No address').substring(0, 60)}`)
                    console.log(`   ${p.state || p.city || 'Unknown'}`)
                })
            }
        }
    }
}

main()
