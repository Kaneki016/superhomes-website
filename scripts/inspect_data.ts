
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function main() {
    console.log('🔍 Inspecting Transaction Data...\n')

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)

    if (error) {
        console.error(error)
        return
    }

    if (data && data.length > 0) {
        const row = data[0]
        console.log('Row Keys:', Object.keys(row).join(', '))
        console.log('District:', row.district)
        console.log('Mukim:', row.mukim)
        console.log('Raw Data:', JSON.stringify(row.raw_data, null, 2))
    } else {
        console.log('No data found.')
    }
}

main()
