// Check database for properties without proper coordinates
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    // Count all properties
    const { count: total } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })

    // Count properties with NULL coords
    const { count: nullCoords } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .is('latitude', null)

    // Count properties with -99 (failed)
    const { count: failedCoords } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', -99)

    // Count properties with valid coords (not NULL and not -99)
    const { count: validCoords } = await supabase
        .from('dup_properties')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .not('latitude', 'eq', -99)

    console.log('\n📊 Property Coordinates Summary:')
    console.log('================================')
    console.log(`Total properties: ${total}`)
    console.log(`With valid coordinates: ${validCoords}`)
    console.log(`With NULL coordinates: ${nullCoords}`)
    console.log(`Marked as failed (-99): ${failedCoords}`)

    // Show a few examples of each
    if (nullCoords && nullCoords > 0) {
        const { data: nullExamples } = await supabase
            .from('dup_properties')
            .select('property_name, address, state')
            .is('latitude', null)
            .limit(3)
        console.log('\n⚠️ Properties with NULL coords:')
        nullExamples?.forEach(p => console.log(`  - ${p.property_name} (${p.address})`))
    }

    if (failedCoords && failedCoords > 0) {
        const { data: failedExamples } = await supabase
            .from('dup_properties')
            .select('property_name, address, state')
            .eq('latitude', -99)
            .limit(3)
        console.log('\n❌ Properties marked as failed:')
        failedExamples?.forEach(p => console.log(`  - ${p.property_name} (${p.address})`))
    }
}

main().catch(console.error)
