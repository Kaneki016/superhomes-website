
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

async function checkProgress() {
    console.log('Checking geocoding progress...')

    // 1. Pending (Null)
    const { count: pendingCount, error: pendingError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .is('latitude', null)

    // 2. Failed (-99)
    const { count: failedCount, error: failedError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('latitude', -99)

    // 3. Success (Not Null and Not -99)
    const { count: successCount, error: successError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .not('latitude', 'is', null)
        .neq('latitude', -99)

    if (pendingError || failedError || successError) {
        console.error('Error fetching counts:', pendingError || failedError || successError)
        return
    }

    const total = (pendingCount || 0) + (failedCount || 0) + (successCount || 0)
    const progress = total > 0 ? ((successCount || 0) + (failedCount || 0)) / total * 100 : 0

    const report = `
--- Geocoding Progress Report ---
Total Transactions: ${total}
✅ Success: ${successCount} (${((successCount || 0) / total * 100).toFixed(1)}%)
❌ Failed: ${failedCount} (${((failedCount || 0) / total * 100).toFixed(1)}%)
⏳ Pending: ${pendingCount} (${((pendingCount || 0) / total * 100).toFixed(1)}%)

Overall Progress (Processed/Total): ${progress.toFixed(1)}%
`
    console.log(report)
    const { writeFileSync } = require('fs')
    writeFileSync('geocoding_status.txt', report)
}

checkProgress()
