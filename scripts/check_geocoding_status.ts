
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkStatus() {
    console.log('Checking Geocoding Status...\n')

    // Check dup_properties
    const { count: propsNull, error: err1 } = await supabase
        .from('dup_properties')
        .select('id', { count: 'exact', head: true })
        .is('latitude', null)
    if (err1) console.error('Error checking dup_properties (NULL):', err1.message)

    const { count: propsFailed, error: err2 } = await supabase
        .from('dup_properties')
        .select('id', { count: 'exact', head: true })
        .eq('latitude', -99)
    if (err2) console.error('Error checking dup_properties (Failed):', err2.message)

    const { count: propsTotal, error: err3 } = await supabase
        .from('dup_properties')
        .select('id', { count: 'exact', head: true })
    if (err3) console.error('Error checking dup_properties (Total):', err3.message)

    console.log('Properties (dup_properties):')
    console.log(`  Total: ${propsTotal}`)
    console.log(`  Pending (NULL): ${propsNull}`)
    console.log(`  Failed (-99): ${propsFailed}`)
    console.log(`  Geocoded: ${propsTotal! - (propsNull || 0) - (propsFailed || 0)}`)

    // Check transactions
    const { count: transNull, error: terr1 } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .is('latitude', null)
    if (terr1) console.error('Error checking transactions (NULL):', terr1.message)

    const { count: transFailed, error: terr2 } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('latitude', -99)
    if (terr2) console.error('Error checking transactions (Failed):', terr2.message)

    const { count: transTotal, error: terr3 } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
    if (terr3) console.error('Error checking transactions (Total):', terr3.message)

    console.log('\nTransactions (transactions):')
    console.log(`  Total: ${transTotal}`)
    console.log(`  Pending (NULL): ${transNull}`)
    console.log(`  Failed (-99): ${transFailed}`)
    console.log(`  Geocoded: ${transTotal! - (transNull || 0) - (transFailed || 0)}`)
}

checkStatus().catch(console.error)
