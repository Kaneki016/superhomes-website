import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('🔍 Checking columns for "transactions"...\n')

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]).join(', '))
    } else {
        console.log('Table empty or error:', error?.message)
    }
}

main()
