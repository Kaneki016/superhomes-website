import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('🔍 simulating frontend query...\n')

    // Simulate what getTransactions(1, 1000) does
    const from = 0
    const to = 999

    // Exact query chain from lib/database.ts
    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .not('latitude', 'is', null)
        .neq('latitude', -99)
        .order('transaction_date', { ascending: false })
        .range(from, to)

    if (error) {
        console.log('❌ Error:', error)
    } else {
        console.log('✅ Success! Read', data.length, 'rows.')
        if (data.length > 0) {
            console.log('Sample row latitude:', data[0].latitude)
        }
    }
}

main()
