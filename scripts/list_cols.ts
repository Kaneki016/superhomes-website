import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('Columns:')
    const { data } = await supabase.from('transactions').select('*').limit(1)
    if (data && data[0]) {
        Object.keys(data[0]).forEach(k => console.log(k))
    }
}

main()
