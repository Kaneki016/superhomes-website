import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function main() {
    console.log('🔍 Testing "transactions" access with ANON key...\n')

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .limit(1)

    if (error) {
        console.log('❌ Error:', error)
        console.log('   Message:', error.message)
        console.log('   Code:', error.code)
        console.log('   Hint:', error.hint)
    } else {
        console.log('✅ Success! Read', data.length, 'rows.')
    }
}

main()
