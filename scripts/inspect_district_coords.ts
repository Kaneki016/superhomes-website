
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    const districts = ['Kemaman', 'Batu Pahat']

    console.log(`Inspecting coordinates for: ${districts.join(', ')}\n`)

    for (const d of districts) {
        const { data } = await supabase
            .from('transactions')
            .select('id, address, latitude, longitude')
            .eq('district', d)
            .neq('latitude', -99)

        console.log(`--- ${d} (${data?.length || 0}) ---`)
        if (data) {
            // Show first 10
            data.slice(0, 10).forEach(row => {
                console.log(`ID: ${row.id} | Addr: ${row.address?.substring(0, 30)}... | ${row.latitude}, ${row.longitude}`)
            })
        }
        console.log('')
    }
}

main()
