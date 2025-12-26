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
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })

    // Get count with coordinates
    const { count: withCoords } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

    // Get count missing coordinates
    const { count: missing } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .or('latitude.is.null,longitude.is.null')

    console.log('========================================')
    console.log('DUP_PROPERTIES COORDINATE STATUS')
    console.log('========================================')
    console.log('Total properties:', total)
    console.log('With coordinates:', withCoords)
    console.log('Missing coordinates:', missing)
    console.log('========================================')

    // If there are missing ones, list them
    if (missing && missing > 0) {
        const { data: missingList } = await supabase
            .from('dup_properties')
            .select('id, property_name, address, state, city')
            .or('latitude.is.null,longitude.is.null')

        console.log('')
        console.log('PROPERTIES MISSING COORDINATES:')
        console.log('')
        missingList?.forEach((p, i) => {
            console.log((i + 1) + '. ' + (p.property_name || 'N/A').substring(0, 50))
            console.log('   ID: ' + p.id)
            console.log('   Address: ' + (p.address || 'N/A').substring(0, 55))
            console.log('   State: ' + (p.state || p.city || 'Unknown'))
            console.log('')
        })
    } else {
        console.log('')
        console.log('All properties have coordinates!')
    }
}

main()
