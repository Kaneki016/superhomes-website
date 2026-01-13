
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('📊 Checking Geocoding Status...\n')

    try {
        // 1. Total Transactions
        const { count: total, error: errTotal } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })

        if (errTotal) {
            console.error('❌ Error fetching total:', errTotal.message)
            return
        }

        // 2. Pending (latitude is null)
        const { count: pending, error: errPending } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .is('latitude', null)

        if (errPending) console.error('❌ Error fetching pending:', errPending.message)

        // 3. Failed (latitude = -99)
        const { count: failed, error: errFailed } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('latitude', -99)

        if (errFailed) console.error('❌ Error fetching failed:', errFailed.message)

        // 4. Success (latitude is not null AND latitude != -99)
        const success = (total || 0) - (pending || 0) - (failed || 0)

        console.log(`\n--- Status Report ---`)
        console.log(`Total Transactions: ${total}`)
        console.log(`✅ Success:         ${success}`)
        console.log(`⏳ Pending:         ${pending}`)
        console.log(`❌ Failed:          ${failed}`)

        const percent = total ? ((success / total) * 100).toFixed(1) : '0.0'
        console.log(`\nProgress: ${percent}% Complete`)

    } catch (e) {
        console.error('Unexpected error:', e)
    }
}

main()
