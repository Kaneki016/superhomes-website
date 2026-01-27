
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function sample() {
    const { data, error } = await supabase.from('transactions').select('neighborhood, district, mukim').limit(20)
    if (error) {
        console.error('Error:', error)
    } else {
        console.log(JSON.stringify(data, null, 2))
    }
}

sample()
